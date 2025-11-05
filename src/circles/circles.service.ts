import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Circle } from './entities/circle.entity';
import { Membership } from './entities/membership.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCircleDto } from './dtos/create-circle.dto';
import { User } from '../users/entities/user.entity';
import { Point } from 'geojson';

@Injectable()
export class CirclesService {
  constructor(
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new circle,
   * making the creator the first admin.
   */
  async create(createCircleDto: CreateCircleDto, user: User) {
    const { name, origin, radius, color } = createCircleDto;

    // Use a transaction to ensure all or nothing
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the circle
      const circle = this.circleRepository.create({
        name,
        origin,
        radius,
        color,
      });
      const newCircle = await queryRunner.manager.save(circle);

      // Create the membership and make the user an admin
      const membership = this.membershipRepository.create({
        user,
        circle: newCircle,
        isAdmin: true,
      });
      await queryRunner.manager.save(membership);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return the complete circle object
      // (excluding the 'memberships' property which could be huge)
      const { ...result } = newCircle;
      return result;
    } catch (err) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      const safeMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : JSON.stringify(err);
      throw new InternalServerErrorException(
        `Failed to create circle: ${safeMessage}`,
      );
    } finally {
      // Always release the query runner
      await queryRunner.release();
    }
  }

  /**
   * (For Android App)
   * Finds all circles a user is a member of, including member count.
   */
  async findCirclesByUserId(userId: string): Promise<Circle[]> {
    return this.circleRepository
      .createQueryBuilder('circle')
      .leftJoin('circle.memberships', 'membership')
      .where('membership.userId = :userId', { userId })
      .loadRelationCountAndMap('circle.memberCount', 'circle.memberships')
      .getMany();
  }

  /**
   * (For Map Screen)
   * Finds all circles within a given radius of an origin point.
   * Uses PostGIS ST_DWithin for efficient geospatial querying.
   */
  async findNearby(origin: Point, radiusInMeters: number): Promise<Circle[]> {
    const [longitude, latitude] = origin.coordinates;

    return this.circleRepository
      .createQueryBuilder('circle')
      .where(
        `ST_DWithin(circle.origin, ST_MakePoint(:longitude, :latitude), :radius)`,
        {
          longitude,
          latitude,
          radius: radiusInMeters,
        },
      )
      .loadRelationCountAndMap('circle.memberCount', 'circle.memberships')
      .getMany();
  }

  /**
   * (For Map Screen)
   * Finds a single circle by ID and includes its member count.
   */
  async findOneWithDetails(id: string): Promise<Circle> {
    const circle = await this.circleRepository
      .createQueryBuilder('circle')
      .where('circle.id = :id', { id })
      .loadRelationCountAndMap('circle.memberCount', 'circle.memberships')
      .getOne();

    if (!circle) {
      throw new NotFoundException(`Circle with ID ${id} not found`);
    }
    return circle;
  }

  /**
   * (Use Case: Join a Circle)
   * Allows a user to join an existing circle.
   */
  async joinCircle(circleId: string, user: User) {
    const circle = await this.circleRepository.findOneBy({ id: circleId });
    if (!circle) {
      throw new NotFoundException(`Circle with ID ${circleId} not found`);
    }

    // Check if user's reputation meets the circle's threshold
    if (user.reputationScore < circle.minimumRepThreshold) {
      throw new ForbiddenException(
        `Your reputation is too low to join this circle (Required: ${circle.minimumRepThreshold})`,
      );
    }

    // Check if user is already a member
    const existingMembership = await this.membershipRepository.findOneBy({
      circleId,
      userId: user.id,
    });
    if (existingMembership) {
      throw new ConflictException('You are already a member of this circle');
    }

    // Create and save the new membership
    const membership = this.membershipRepository.create({
      circleId,
      userId: user.id,
      isAdmin: false,
    });
    return this.membershipRepository.save(membership);
  }

  /**
   * (Use Case: Leave a Circle)
   * Allows a user to leave a circle.
   */
  async leaveCircle(circleId: string, userId: string) {
    const membership = await this.membershipRepository.findOneBy({
      circleId,
      userId,
    });
    if (!membership) {
      throw new NotFoundException('You are not a member of this circle');
    }

    // Safety check: prevent last admin from leaving
    if (membership.isAdmin) {
      const adminCount = await this.membershipRepository.count({
        where: { circleId, isAdmin: true },
      });
      if (adminCount === 1) {
        throw new ForbiddenException(
          'You cannot leave as you are the last admin. Please delete the circle or promote another member first.',
        );
      }
    }

    await this.membershipRepository.remove(membership);
    return { message: 'Successfully left the circle' };
  }

  /**
   * (Admin Use Case)
   * Updates a circle's details (e.g., name, radius).
   * Requires the user to be an admin.
   */
  async update(circleId: string, updateDto: any, userId: string) {
    // Check if user is an admin for this circle
    await this.checkAdmin(circleId, userId);

    // DTO would be `UpdateCircleDto`
    const result = await this.circleRepository.update(circleId, updateDto);
    if (result.affected === 0) {
      throw new NotFoundException(`Circle with ID ${circleId} not found`);
    }
    return this.findOneWithDetails(circleId);
  }

  /**
   * (Admin Use Case)
   * Deletes a circle.
   * Requires the user to be an admin.
   */
  async remove(circleId: string, userId: string) {
    // Check if user is an admin
    await this.checkAdmin(circleId, userId);

    const circle = await this.circleRepository.findOneBy({ id: circleId });
    if (!circle) {
      throw new NotFoundException(`Circle with ID ${circleId} not found`);
    }

    // The 'onDelete: CASCADE' in your Membership
    // entity will handle deleting all associated data.
    await this.circleRepository.remove(circle);
    return { message: `Circle ${circle.name} deleted successfully` };
  }

  // --- PRIVATE HELPER METHODS ---

  /**
   * A private helper to check if a user is an admin of a circle.
   * Throws a ForbiddenException if not.
   */
  private async checkAdmin(circleId: string, userId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { circleId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this circle');
    }
    if (!membership.isAdmin) {
      throw new ForbiddenException(
        'You do not have admin rights for this circle',
      );
    }
    return membership;
  }
}
