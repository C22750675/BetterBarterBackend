INSERT INTO public.category (id,name,"parentCategoryId") VALUES
	 ('34fadd71-7e29-4c4f-8f43-acf3d723f76d'::uuid,'Produce',NULL),
	 ('c619bf92-1d81-42f6-a19b-39014edd1ca0'::uuid,'Baked Goods',NULL),
	 ('053a3b11-c837-4842-92d2-14bf1412ee80'::uuid,'Vegetables','34fadd71-7e29-4c4f-8f43-acf3d723f76d'::uuid),
	 ('89c05f24-ed63-4117-9297-d2e3725903fd'::uuid,'Breads','c619bf92-1d81-42f6-a19b-39014edd1ca0'::uuid);
INSERT INTO public.item (id,name,description,"imageUrl","estimatedValue",stock,"bestBeforeDate","useByDate","createdAt","updatedAt","ownerId","categoryId","circleId") VALUES
	 ('a9e1b6fe-00f8-4f15-ab09-5eaae3957f5d'::uuid,'Carrots - 500g','Organic carrots, great in stews.','/c32bf10ce10ef9489232cefa7944105ae3c.jpg',5.00,4,NULL,NULL,'2026-03-01 16:24:19.61954','2026-03-01 16:24:19.61954','776dfd6d-e841-4cd7-9e8c-d3557f19790f'::uuid,'053a3b11-c837-4842-92d2-14bf1412ee80'::uuid,NULL),
	 ('4e9cbb19-3e85-442f-b057-18dbc227accb'::uuid,'Load of Sourdough','Crunchy and great with my homemade butter.','/cf8f732ff32567fa310ef7710d47f668d5.jpg',4.00,3,NULL,NULL,'2026-03-01 16:25:38.4245','2026-03-01 16:25:38.4245','cfd343a3-aae1-4a4c-96fb-2cc7771a777a'::uuid,'89c05f24-ed63-4117-9297-d2e3725903fd'::uuid,NULL);
INSERT INTO public."user" (id,username,"passwordHash",email,"phoneNumber","isEmailVerified","isPhoneVerified",bio,"profilePictureUrl","reputationScore",alpha,beta,"tradeCount",penalties,"lastReputationUpdate","createdAt") VALUES
	 ('cfd343a3-aae1-4a4c-96fb-2cc7771a777a'::uuid,'alicehogarty','$2b$10$Cx1DT1MzUVs9Cxy3JjkZg..U9DFNOKqVyY8o7OYen3SDHVprwftHi',NULL,NULL,false,false,NULL,'/59ae8f7d1da49febea0910fc31067fabac.jpg',50.0,1.0,1.0,0,0.0,NULL,'2026-03-01 16:18:50.770149'),
	 ('776dfd6d-e841-4cd7-9e8c-d3557f19790f'::uuid,'almaisla','$2b$10$9DDA9UIJT1A/K5S254JZVOc2f3eJTthZ4mGxRUQReU3Ntbr6g1RF2',NULL,NULL,false,false,NULL,'/810efd326b51baf52b3aeea5e105b0ee73.jpg',50.0,1.0,1.0,0,0.0,NULL,'2026-03-01 16:17:17.009386');
