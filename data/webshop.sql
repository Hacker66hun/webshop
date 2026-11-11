-- =====================================================
-- 32. feladat - Webshop rendelések (4 tábla)
-- Importálás: phpMyAdmin -> Importálás -> ez a fájl
-- Újra importálva visszaáll az eredeti állapot.
-- =====================================================

CREATE DATABASE IF NOT EXISTS `webshop` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `webshop`;

DROP TABLE IF EXISTS `tetelek`;
DROP TABLE IF EXISTS `rendelesek`;
DROP TABLE IF EXISTS `termekek`;
DROP TABLE IF EXISTS `vasarlok`;

CREATE TABLE `vasarlok` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nev` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `varos` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vasarlok_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE `termekek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nev` varchar(100) NOT NULL,
  `kategoria` varchar(30) NOT NULL,
  `ar` int(11) NOT NULL COMMENT 'a mai ár, Ft',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE `rendelesek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vasarlo_id` int(11) NOT NULL,
  `datum` date NOT NULL,
  `statusz` enum('új','szállítás alatt','teljesítve','törölve') NOT NULL DEFAULT 'új',
  PRIMARY KEY (`id`),
  KEY `fk_rendelesek_vasarlo` (`vasarlo_id`),
  CONSTRAINT `fk_rendelesek_vasarlo` FOREIGN KEY (`vasarlo_id`) REFERENCES `vasarlok` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- A rendelés tételei. Az egységár a RENDELÉS NAPJÁN érvényes ár:
-- ha a termék ára később változik, a régi rendelések végösszege nem változhat meg.
CREATE TABLE `tetelek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rendeles_id` int(11) NOT NULL,
  `termek_id` int(11) NOT NULL,
  `db` smallint(5) UNSIGNED NOT NULL,
  `egysegar` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tetelek_rendeles` (`rendeles_id`),
  KEY `fk_tetelek_termek` (`termek_id`),
  CONSTRAINT `fk_tetelek_rendeles` FOREIGN KEY (`rendeles_id`) REFERENCES `rendelesek` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tetelek_termek` FOREIGN KEY (`termek_id`) REFERENCES `termekek` (`id`),
  CONSTRAINT `chk_tetelek_db` CHECK (`db` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

INSERT INTO `vasarlok` (`id`, `nev`, `email`, `varos`) VALUES
(1, 'Kiss Anna', 'anna.kiss@pelda.hu', 'Budapest'),
(2, 'Nagy Péter', 'peter.nagy@pelda.hu', 'Debrecen'),
(3, 'Tóth Eszter', 'eszter.toth@pelda.hu', 'Budapest'),
(4, 'Szabó Márk', 'mark.szabo@pelda.hu', 'Szeged'),
(5, 'Horváth Lilla', 'lilla.horvath@pelda.hu', 'Pécs'),
(6, 'Varga Bence', 'bence.varga@pelda.hu', 'Győr');

INSERT INTO `termekek` (`id`, `nev`, `kategoria`, `ar`) VALUES
(1, 'Vezeték nélküli egér', 'periféria', 6990),
(2, 'Mechanikus billentyűzet', 'periféria', 24990),
(3, '27 colos monitor', 'monitor', 79990),
(4, 'USB-C hub', 'kiegészítő', 8490),
(5, 'Laptoptáska', 'kiegészítő', 11990),
(6, 'Webkamera', 'periféria', 15990),
(7, '24 colos monitor', 'monitor', 49990),
(8, 'Egérpad XL', 'kiegészítő', 4990);

INSERT INTO `rendelesek` (`id`, `vasarlo_id`, `datum`, `statusz`) VALUES
(1, 1, '2026-08-03', 'teljesítve'),
(2, 2, '2026-08-15', 'teljesítve'),
(3, 3, '2026-08-28', 'törölve'),
(4, 1, '2026-09-02', 'teljesítve'),
(5, 4, '2026-09-10', 'teljesítve'),
(6, 5, '2026-09-21', 'teljesítve'),
(7, 2, '2026-09-30', 'szállítás alatt'),
(8, 3, '2026-10-05', 'teljesítve'),
(9, 4, '2026-10-12', 'új'),
(10, 1, '2026-10-18', 'új');

INSERT INTO `tetelek` (`id`, `rendeles_id`, `termek_id`, `db`, `egysegar`) VALUES
(1, 1, 1, 1, 6990),
(2, 1, 4, 1, 8490),
(3, 2, 3, 1, 79990),
(4, 2, 2, 1, 24990),
(5, 3, 7, 2, 49990),
(6, 4, 6, 1, 15990),
(7, 4, 1, 2, 6490),
(8, 5, 2, 1, 24990),
(9, 5, 5, 1, 11990),
(10, 5, 4, 2, 8490),
(11, 6, 7, 1, 47990),
(12, 7, 1, 3, 6990),
(13, 7, 6, 1, 15990),
(14, 8, 3, 1, 79990),
(15, 8, 5, 1, 11990),
(16, 9, 4, 1, 8490),
(17, 10, 2, 1, 24990),
(18, 10, 1, 1, 6990),
(19, 10, 7, 1, 49990);
