import pool from "../data/db.js";
import { Router } from "express";

const statisztikaRoutes = Router();

statisztikaRoutes.get('/', async (req, res) => {
    let sql = 'SELECT 1 AS ok';
    let [eredmeny] = await pool.query(sql);
    res.json(eredmeny);
});

statisztikaRoutes.get('/havi', async (req, res) => {
    let sql = 'SELECT DATE_FORMAT(rendelesek.datum, "%Y-%m") AS honap, COUNT(DISTINCT rendelesek.id) AS rendelesDb, SUM(tetelek.egysegar * tetelek.db) AS bevetel FROM rendelesek JOIN tetelek ON tetelek.rendeles_id = rendelesek.id WHERE rendelesek.statusz != "törölve" GROUP BY honap ORDER BY honap ASC';
    let [eredmeny] = await pool.query(sql);
    res.json(eredmeny);
});

statisztikaRoutes.get('/top-termekek', async (req, res) => {
    let n = Number(req.query.n) || 3;

    let sql = 'SELECT termekek.nev AS termek, SUM(tetelek.db) AS eladottDb, SUM(tetelek.db * tetelek.egysegar) AS bevetel FROM termekek JOIN tetelek ON tetelek.termek_id = termekek.id JOIN rendelesek ON rendelesek.id = tetelek.rendeles_id WHERE rendelesek.statusz != "törölve" GROUP BY termekek.id, termekek.nev ORDER BY eladottDb DESC LIMIT ?';

    let [eredmeny] = await pool.query(sql, [n]);
    res.json(eredmeny);
});

statisztikaRoutes.get('/kategoriak', async (req, res) => {
    let sql = 'SELECT termekek.kategoria, SUM(tetelek.db) AS eladottDb, SUM(tetelek.db * tetelek.egysegar) AS bevetel FROM termekek JOIN tetelek ON tetelek.termek_id = termekek.id JOIN rendelesek ON rendelesek.id = tetelek.rendeles_id WHERE rendelesek.statusz != "törölve" GROUP BY termekek.kategoria ORDER BY bevetel DESC';
    let [eredmeny] = await pool.query(sql);
    res.json(eredmeny);
});

export default statisztikaRoutes;