import pool from "../data/db.js";
import { Router }from "express";
const vasarlokRoutes = Router();

vasarlokRoutes.get('/', async (req, res) => {
    let params = [];
    let szurok = [];
    const {rendelesek} = req.query;
    if (rendelesek) {
        szurok.push('rendelesek.statusz = ?');
        params.push(rendelesek);
    }
    let sql = 'SELECT vasarlok.id, vasarlok.nev, vasarlok.varos, COUNT(DISTINCT CASE WHEN rendelesek.statusz != "törölve" THEN rendelesek.id END) AS rendelesDb, COALESCE(SUM(CASE WHEN rendelesek.statusz != "törölve" THEN tetelek.db * tetelek.egysegar ELSE 0 END), 0) AS osszKoltes FROM vasarlok LEFT JOIN rendelesek ON rendelesek.vasarlo_id = vasarlok.id LEFT JOIN tetelek ON tetelek.rendeles_id = rendelesek.id';
    if(szurok.length > 0) {
        sql += ' WHERE ' + szurok.join(' AND ');
    }
    sql += ' GROUP BY vasarlok.id, vasarlok.nev, vasarlok.varos ORDER BY osszKoltes DESC';
    let [eredmeny] = await pool.query(sql, params);
    res.json(eredmeny);
});

vasarlokRoutes.get('/:id/rendelesek', async (req, res) => {
    const {id} = req.params;
    let sql = 'SELECT id FROM vasarlok WHERE id = ?';
    let [vasarlo] = await pool.query(sql, [id]);
    if(vasarlo.length === 0) {
        return res.status(404).json({
            hiba: "A vásárló nem található!"
        });
    }
    sql = 'SELECT rendelesek.id, DATE_FORMAT(rendelesek.datum, "%Y-%m-%d") AS datum, rendelesek.statusz, SUM(tetelek.db) AS darab, SUM(tetelek.db * tetelek.egysegar) AS vegosszeg FROM rendelesek LEFT JOIN tetelek ON tetelek.rendeles_id = rendelesek.id WHERE rendelesek.vasarlo_id = ? GROUP BY rendelesek.id, rendelesek.datum, rendelesek.statusz ORDER BY rendelesek.datum ASC';
    let [eredmeny] = await pool.query(sql, [id]);
    res.json(eredmeny);
});

export default vasarlokRoutes;