Run the following commands after installing PostgreSQL:
psql -U postgres -c "CREATE DATABASE construction_inventory;"
psql -U postgres -d construction_inventory -f backend/schema.sql

