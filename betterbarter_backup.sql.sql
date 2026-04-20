INSERT INTO
	public.category (id, "name", "parentCategoryId")
VALUES
	(
		'f5b14abc-a321-4672-95b2-b87ebd1839c8' :: uuid,
		'Handmade Crafts',
		NULL
	),
	(
		'61ba2db3-bf8e-408c-b0d9-640fbf5fa3b1' :: uuid,
		'Fresh Produce',
		NULL
	),
	(
		'923de34c-47da-481b-8651-0e178f4e822d' :: uuid,
		'Baked & Cooked Goods',
		NULL
	),
	(
		'ab6b5125-3937-4b9e-a111-0aed2bc1fcd0' :: uuid,
		'DIY & Self-Made Kits',
		NULL
	),
	(
		'6142ea15-c9e9-499f-8a5a-c0993bd751c5' :: uuid,
		'Woodworking',
		'f5b14abc-a321-4672-95b2-b87ebd1839c8' :: uuid
	),
	(
		'7377d219-da72-4d7e-97cd-99f116810f00' :: uuid,
		'Pottery & Ceramics',
		'f5b14abc-a321-4672-95b2-b87ebd1839c8' :: uuid
	),
	(
		'109758f4-8445-40d9-8ecb-d10712a9dcb9' :: uuid,
		'Textiles & Knits',
		'f5b14abc-a321-4672-95b2-b87ebd1839c8' :: uuid
	),
	(
		'2fb5a85f-a44f-476f-99db-da39d7169d82' :: uuid,
		'Organic Vegetables',
		'61ba2db3-bf8e-408c-b0d9-640fbf5fa3b1' :: uuid
	),
	(
		'e6e3b7f5-efe0-4568-8329-a24c14cb9aaa' :: uuid,
		'Seasonal Fruits',
		'61ba2db3-bf8e-408c-b0d9-640fbf5fa3b1' :: uuid
	),
	(
		'1a68e658-e3a4-4cbc-bc12-5e47f14bfb79' :: uuid,
		'Herbs & Spices',
		'61ba2db3-bf8e-408c-b0d9-640fbf5fa3b1' :: uuid
	);

INSERT INTO
	public.category (id, "name", "parentCategoryId")
VALUES
	(
		'512a9e0a-0496-45b4-be62-6ebc1ca51934' :: uuid,
		'Preserves & Jams',
		'923de34c-47da-481b-8651-0e178f4e822d' :: uuid
	),
	(
		'b6bad203-2efa-422c-afc6-88516d87020b' :: uuid,
		'Home-cooked Meals',
		'923de34c-47da-481b-8651-0e178f4e822d' :: uuid
	),
	(
		'fe176e34-927a-4951-a4ff-0b766be1f678' :: uuid,
		'Garden Starters',
		'ab6b5125-3937-4b9e-a111-0aed2bc1fcd0' :: uuid
	),
	(
		'b809c487-446c-41de-9fa1-f7553db8c7c4' :: uuid,
		'Crafting Supplies',
		'ab6b5125-3937-4b9e-a111-0aed2bc1fcd0' :: uuid
	),
	(
		'dd6feb12-8240-4d51-a68f-d052caaa3cdc' :: uuid,
		'Breads',
		'923de34c-47da-481b-8651-0e178f4e822d' :: uuid
	),
	(
		'e470d977-2d55-4533-93d3-b16d9a16e2b3' :: uuid,
		'Pastries & Sweets',
		'923de34c-47da-481b-8651-0e178f4e822d' :: uuid
	);

INSERT INTO
	public.circle (
		id,
		"name",
		description,
		"imageUrl",
		origin,
		radius,
		"reputationScore",
		"minimumRepThreshold",
		color,
		"createdAt"
	)
VALUES
	(
		'f0d0e5f0-7111-42f2-b278-a3f62d2eb4e7' :: uuid,
		'TUD Grangegorman Food Trade',
		'Welcome to the Grangegorman Campus Circle! We love to trade a wide range of homemade and homegrown food.',
		'/b7f5d1861264ea9f507b3b8fe1bc73b32c1c7f27b81bf409daa1a7d6d6f9c60f.jpg',
		'SRID=4326;POINT (-6.280180920211734 53.355295282136474)' :: public.geography,
		300,
		5,
		0,
		'#E67E22',
		'2026-04-20 20:47:16.840964'
	),
	(
		'e7630c74-ab09-4c6f-bd71-3cf5f1326ef6' :: uuid,
		'Stoneybatter Handmade Clothes',
		'From knitwear to leathercrafts! ',
		'/0b2a5b2244a504ee4404bf259e05bd8d22be948421ac1a7b3e53e3fc912db2f4.png',
		'SRID=4326;POINT (-6.284738491344575 53.352892715714454)' :: public.geography,
		250,
		5,
		0,
		'#2ECC71',
		'2026-04-20 21:08:24.666085'
	),
	(
		'81505a5a-d3a7-45b0-b1d7-a84e53283f45' :: uuid,
		'The Liberties Student Meals',
		'Trade for pre-made meals, for busy students! ',
		'/cdce98ad3a18c4fce47f62fdb98653db60378a3166ec0a96d61e3ba3615e1377.jpg',
		'SRID=4326;POINT (-6.281221644352172 53.34158787095182)' :: public.geography,
		400,
		5,
		0,
		'#9B59B6',
		'2026-04-20 21:11:10.278817'
	);

INSERT INTO
	public.item (
		id,
		"name",
		description,
		"imageUrl",
		"estimatedValue",
		stock,
		"bestBeforeDate",
		"useByDate",
		"createdAt",
		"updatedAt",
		"ownerId",
		"categoryId",
		"circleId"
	)
VALUES
	(
		'9498bf2c-7e1b-483f-a5af-56520a6effba' :: uuid,
		'Fresh',
		'Soft in the middle with a crunchy crust',
		'/151746a8f501e4e0f2d6856b7f181cd264092622bd692f3129a918c78143b7fd.jpg',
		5.00,
		9,
		NULL,
		'2026-04-24',
		'2026-04-20 20:55:19.515021',
		'2026-04-20 20:55:57.055691',
		'874559b9-d80b-4a37-bb2c-fd064666814f' :: uuid,
		'dd6feb12-8240-4d51-a68f-d052caaa3cdc' :: uuid,
		NULL
	),
	(
		'0a6b86f6-314d-4b55-93bb-ba55a2d7762f' :: uuid,
		'Croissants',
		'Freshly baked every morning.',
		'/0e537b88e641825f3aaaa989f69d9670ddc1693ed0ef17de538f3beb3102fed7.jpg',
		2.00,
		20,
		NULL,
		'2026-04-23',
		'2026-04-20 20:59:26.580657',
		'2026-04-20 20:59:26.580657',
		'874559b9-d80b-4a37-bb2c-fd064666814f' :: uuid,
		'e470d977-2d55-4533-93d3-b16d9a16e2b3' :: uuid,
		NULL
	),
	(
		'ea2c168e-32c7-4164-89cd-37d1760081ac' :: uuid,
		'Homemade Strawberry Jam',
		'Not too sweet, made with berries from my garden.',
		'/ad96fd3d7952e657d285bb35a51ae12779c9eb3e8adaea2421fd6e39b8ea69cb.jpg',
		5.00,
		15,
		'2027-02-11',
		NULL,
		'2026-04-20 21:03:17.110415',
		'2026-04-20 21:03:17.110415',
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		'512a9e0a-0496-45b4-be62-6ebc1ca51934' :: uuid,
		NULL
	),
	(
		'7467d9bc-5d19-4b30-a76d-57989699e64f' :: uuid,
		'Organic Carrots 500g',
		'Perfect for salads and stews.',
		'/b61815e86b81083259ba4ef4ac598b7c4605c136786df62dd63fc2943550abff.jpg',
		5.00,
		5,
		'2026-05-02',
		NULL,
		'2026-04-20 21:05:03.991371',
		'2026-04-20 21:05:03.991371',
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		'2fb5a85f-a44f-476f-99db-da39d7169d82' :: uuid,
		NULL
	),
	(
		'12a07e27-ce53-4532-8ede-9b9cb3a8b703' :: uuid,
		'Spaghetti Bolognese',
		'400g.
Made from organic beef and homegrown tomatoes.',
		'/496f89a46392c8d995b0a296caaab2c82f4ebb28c2f672026e8f963450ab30a0.jpg',
		5.00,
		11,
		NULL,
		'2026-04-26',
		'2026-04-20 21:14:01.176288',
		'2026-04-20 21:14:57.279674',
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		'b6bad203-2efa-422c-afc6-88516d87020b' :: uuid,
		NULL
	);

INSERT INTO
	public.membership (id, "isAdmin", "joinDate", "userId", "circleId")
VALUES
	(
		'5734a387-c2ca-4817-89cb-bb0193b506b9' :: uuid,
		true,
		'2026-04-20 20:47:16.840964',
		'874559b9-d80b-4a37-bb2c-fd064666814f' :: uuid,
		'f0d0e5f0-7111-42f2-b278-a3f62d2eb4e7' :: uuid
	),
	(
		'26cf9e1f-ddee-4bce-be7f-b3b9b6c38f70' :: uuid,
		true,
		'2026-04-20 21:08:24.666085',
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		'e7630c74-ab09-4c6f-bd71-3cf5f1326ef6' :: uuid
	),
	(
		'ef029466-fc25-41f2-890d-7184d83d3fab' :: uuid,
		true,
		'2026-04-20 21:11:10.278817',
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		'81505a5a-d3a7-45b0-b1d7-a84e53283f45' :: uuid
	);

INSERT INTO
	public.trade (
		id,
		status,
		"creationDate",
		"completionDate",
		description,
		"proposerId",
		"recipientId",
		"offeredItemQuantity",
		"offeredItemId",
		"circleId",
		"isRatedByProposer",
		"isRatedByRecipient"
	)
VALUES
	(
		'e68db5ee-1c2b-4948-9722-5b85d567cf78' :: uuid,
		'pending' :: public."trade_status_enum",
		'2026-04-20 20:55:57.055691',
		NULL,
		'I''m looking for some jams, raspberry or strawberry.',
		'874559b9-d80b-4a37-bb2c-fd064666814f' :: uuid,
		NULL,
		1,
		'9498bf2c-7e1b-483f-a5af-56520a6effba' :: uuid,
		'f0d0e5f0-7111-42f2-b278-a3f62d2eb4e7' :: uuid,
		false,
		false
	),
	(
		'cd44cb5f-6623-48a7-b083-bc98d34a66dd' :: uuid,
		'pending' :: public."trade_status_enum",
		'2026-04-20 21:14:57.279674',
		NULL,
		'Happy to trade for anything!',
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		NULL,
		1,
		'12a07e27-ce53-4532-8ede-9b9cb3a8b703' :: uuid,
		'81505a5a-d3a7-45b0-b1d7-a84e53283f45' :: uuid,
		false,
		false
	);

INSERT INTO
	public."user" (
		id,
		username,
		"passwordHash",
		email,
		"phoneNumber",
		"isEmailVerified",
		"isPhoneVerified",
		bio,
		"profilePictureUrl",
		"reputationScore",
		alpha,
		beta,
		"tradeCount",
		"lastReputationUpdate",
		"createdAt"
	)
VALUES
	(
		'874559b9-d80b-4a37-bb2c-fd064666814f' :: uuid,
		'alicehogarty',
		'$2b$10$idbQC8FdUGX2ovEUkt785eoTmmyEBvEqj2XhmqcDNCACQricJhZqi',
		NULL,
		NULL,
		false,
		false,
		'Welcome to my profile! I grow seasonal fruits and vegetables.',
		'/733bf22f06c369ab0789413f12cb1cbe7112bb016057be4d80f1295cd6bb785e.jpg',
		8.84,
		2.0,
		1.0,
		0,
		NULL,
		'2026-04-20 19:56:04.82991'
	),
	(
		'182ab79c-a048-4149-bd33-90ad924ab526' :: uuid,
		'markbaker',
		'$2b$10$gl7KUIMkpsmJFazT5NvDMOyPyA2zlrfsNmPdy.2TJ0EUiSQjDy/y.',
		NULL,
		NULL,
		false,
		false,
		'Hello, I''m Mark. I love to help students by trading budget, high-quality meals every week.',
		'/10e2744df3a6487dbe984d971075da94378bc73e88a7603b6ce712c91ada4508.jpg',
		8.84,
		2.0,
		1.0,
		0,
		NULL,
		'2026-04-20 21:01:31.735945'
	);