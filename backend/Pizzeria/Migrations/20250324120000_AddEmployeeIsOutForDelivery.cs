using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Pizzeria.Data;

#nullable disable

namespace Pizzeria.Migrations
{
    [DbContext(typeof(PizzeriaContext))]
    [Migration("20250324120000_AddEmployeeIsOutForDelivery")]
    public class AddEmployeeIsOutForDelivery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE pizzeria.employees
                ADD COLUMN IF NOT EXISTS is_out_for_delivery boolean NOT NULL DEFAULT false;
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE pizzeria.employees
                DROP COLUMN IF EXISTS is_out_for_delivery;
                """
            );
        }
    }
}
