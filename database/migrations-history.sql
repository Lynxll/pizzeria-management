-- Applied EF migrations exported from the source database. No user data.
BEGIN;
INSERT INTO pizzeria."__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20250324120000_AddEmployeeIsOutForDelivery', '8.0.11') ON CONFLICT ("MigrationId") DO NOTHING;
INSERT INTO pizzeria."__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20250324210000_AddEmployeeRouteAnchor', '8.0.11') ON CONFLICT ("MigrationId") DO NOTHING;
INSERT INTO pizzeria."__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20251111170824_AddIdentityAndCustomerUserLink', '8.0.11') ON CONFLICT ("MigrationId") DO NOTHING;
INSERT INTO pizzeria."__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20251209120249_AddCollectorEmployeeRole', '8.0.11') ON CONFLICT ("MigrationId") DO NOTHING;
INSERT INTO pizzeria."__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20260325000100_AddRefreshTokens', '8.0.11') ON CONFLICT ("MigrationId") DO NOTHING;
COMMIT;
