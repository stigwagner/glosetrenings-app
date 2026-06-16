-- Create test users hermann and vilma
-- Password: pwpw67
-- Hash: SHA256 of "pwpw67" = 0cb80cfecbe6dadebb9eb558233e0c009950183945ed93897582cebbb245f89f

INSERT OR IGNORE INTO users (id, username, password_hash, display_name, birth_year, school_start_year, grade) VALUES
(1, 'hermann', '0cb80cfecbe6dadebb9eb558233e0c009950183945ed93897582cebbb245f89f', 'Hermann', 2018, 2024, 2),
(2, 'vilma', '0cb80cfecbe6dadebb9eb558233e0c009950183945ed93897582cebbb245f89f', 'Vilma', 2016, 2022, 4);
