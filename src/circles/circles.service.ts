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

  async create(createCircleDto: CreateCircleDto, user: User) {
    const { name, origin, radius, color, description } = createCircleDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const circle = this.circleRepository.create({
        name,
        origin,
        radius,
        color,
        description,
      });
      const newCircle = await queryRunner.manager.save(circle);

      const membership = this.membershipRepository.create({
        user,
        circle: newCircle,
        isAdmin: true,
      });
      await queryRunner.manager.save(membership);

      await queryRunner.commitTransaction();

      newCircle.memberships = [membership];
      return newCircle;
    } catch (err) {
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
      await queryRunner.release();
    }
  }

  async findCirclesByUserId(userId: string): Promise<Circle[]> {
    return this.circleRepository
      .createQueryBuilder('circle')
      .leftJoin('circle.memberships', 'membership')
      .where('membership.userId = :userId', { userId })
      .loadRelationCountAndMap('circle.memberCount', 'circle.memberships')
      .leftJoinAndSelect('circle.memberships', 'all_memberships')
      .leftJoinAndSelect('all_memberships.user', 'user')
      .getMany();
  }

  /**
   * Finds circles within a radius.
   * If userId is provided, it checks if the user is a member and adds 'isMember' property.
   */
  async findNearby(
    origin: Point,
    radiusInMeters: number,
    userId?: string,
  ): Promise<any[]> {
    // Return any[] or a DTO that extends Circle
    const [longitude, latitude] = origin.coordinates;

    const query = this.circleRepository
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
      .leftJoinAndSelect('circle.memberships', 'all_memberships')
      .leftJoinAndSelect('all_memberships.user', 'user');

    const circles = await query.getMany();

    if (userId) {
      // Check membership for each circle
      const userMemberships = await this.membershipRepository.find({
        where: { userId },
        select: ['circleId'],
      });
      const joinedCircleIds = new Set(userMemberships.map((m) => m.circleId));

      return circles.map((circle) => ({
        ...circle,
        isMember: joinedCircleIds.has(circle.id),
      }));
    }

    return circles.map((circle) => ({ ...circle, isMember: false }));
  }

  async findOneWithDetails(id: string): Promise<Circle> {
    const circle = await this.circleRepository
      .createQueryBuilder('circle')
      .where('circle.id = :id', { id })
      .loadRelationCountAndMap('circle.memberCount', 'circle.memberships')
      .leftJoinAndSelect('circle.memberships', 'all_memberships')
      .leftJoinAndSelect('all_memberships.user', 'user')
      .getOne();

    if (!circle) {
      throw new NotFoundException(`Circle with ID ${id} not found`);
    }
    return circle;
  }

  async joinCircle(circleId: string, user: User) {
    const circle = await this.circleRepository.findOneBy({ id: circleId });
    if (!circle) {
      throw new NotFoundException(`Circle with ID ${circleId} not found`);
    }

    if (user.reputationScore < circle.minimumRepThreshold) {
      throw new ForbiddenException(
        `Your reputation is too low to join this circle (Required: ${circle.minimumRepThreshold})`,
      );
    }

    const existingMembership = await this.membershipRepository.findOneBy({
      circleId,
      userId: user.id,
    });
    if (existingMembership) {
      throw new ConflictException('You are already a member of this circle');
    }

    const membership = this.membershipRepository.create({
      circleId,
      userId: user.id,
      isAdmin: false,
    });
    return this.membershipRepository.save(membership);
  }

  async leaveCircle(circleId: string, userId: string) {
    const membership = await this.membershipRepository.findOneBy({
      circleId,
      userId,
    });
    if (!membership) {
      throw new NotFoundException('You are not a member of this circle');
    }

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

  async update(circleId: string, updateDto: any, userId: string) {
    await this.checkAdmin(circleId, userId);
    const result = await this.circleRepository.update(circleId, updateDto);
    if (result.affected === 0) {
      throw new NotFoundException(`Circle with ID ${circleId} not found`);
    }
    return this.findOneWithDetails(circleId);
  }

  async remove(circleId: string, userId: string) {
    await this.checkAdmin(circleId, userId);
    const circle = await this.circleRepository.findOneBy({ id: circleId });
    if (!circle) {
      throw new NotFoundException(`Circle with ID ${circleId} not found`);
    }
    await this.circleRepository.remove(circle);
    return { message: `Circle ${circle.name} deleted successfully` };
  }

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
