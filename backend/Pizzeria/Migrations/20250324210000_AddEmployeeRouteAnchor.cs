using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Pizzeria.Data;

#nullable disable

namespace Pizzeria.Migrations
{
    [DbContext(typeof(PizzeriaContext))]
    [Migration("20250324210000_AddEmployeeRouteAnchor")]
    public class AddEmployeeRouteAnchor : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE pizzeria.employees
                ADD COLUMN IF NOT EXISTS route_anchor_lat numeric(9,6) NULL;

                ALTER TABLE pizzeria.employees
                ADD COLUMN IF NOT EXISTS route_anchor_lng numeric(9,6) NULL;
                """
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE pizzeria.employees
                DROP COLUMN IF EXISTS route_anchor_lat;

                ALTER TABLE pizzeria.employees
                DROP COLUMN IF EXISTS route_anchor_lng;
                """
            );
        }
    }
}
