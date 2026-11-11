import pool from "../data/db.js";
import { Router }from "express";
const termekekRoutes = Router();

termekekRoutes.get('/sosem-rendelt', async (req, res) => {
    let sql = 'SELECT termekek.id, termekek.nev, termekek.kategoria, termekek.ar FROM termekek WHERE NOT EXISTS (SELECT 1 FROM tetelek WHERE tetelek.termek_id = termekek.id)';
    let [eredmeny] = await pool.query(sql);
    res.json(eredmeny);
});

export default termekekRoutes;