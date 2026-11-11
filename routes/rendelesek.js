import pool from "../data/db.js";
import { Router } from "express";
const rendelesekRoutes = Router();

rendelesekRoutes.get("/", async (req, res) => {
    let params = [];
    let szurok = [];
    const { statusz, tol, ig } = req.query;
    function ervenyesDatum(datum) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
            return false;
        }
        const [ev, honap, nap] = datum.split("-").map(Number);
        const d = new Date(ev, honap - 1, nap);
        return d.getFullYear() === ev &&
            d.getMonth() === honap - 1 &&
            d.getDate() === nap;
    }
    if (statusz) {
        szurok.push("rendelesek.statusz = ?");
        params.push(statusz);
    }
    if (tol) {
        if (!ervenyesDatum(tol)) {
            return res.status(400).json({
                hiba: "Hibás dátum!"
            });
        }
        szurok.push("rendelesek.datum >= ?");
        params.push(tol);
    }
    if (ig) {
        if (!ervenyesDatum(ig)) {
            return res.status(400).json({
                hiba: "Hibás dátum!"
            });
        }
        szurok.push("rendelesek.datum <= ?");
        params.push(ig);
    }
    let sql = `SELECT rendelesek.id, DATE_FORMAT(rendelesek.datum, "%Y-%m-%d") AS datum, rendelesek.statusz, vasarlok.nev AS vasarlo, SUM(tetelek.db) AS darab, SUM(tetelek.db * tetelek.egysegar) AS vegosszeg FROM rendelesek JOIN vasarlok ON vasarlok.id = rendelesek.vasarlo_id JOIN tetelek ON tetelek.rendeles_id = rendelesek.id`;
    if (szurok.length > 0) {
        sql += " WHERE " + szurok.join(" AND ");
    }
    sql += ` GROUP BY rendelesek.id, rendelesek.datum, rendelesek.statusz, vasarlok.nev`;
    sql += ` ORDER BY rendelesek.datum ASC`;
    let [eredmeny] = await pool.query(sql, params);
    res.json(eredmeny);
});

rendelesekRoutes.get("/:id", async (req, res) => {
    const { id } = req.params;
    let sql = `SELECT rendelesek.id, DATE_FORMAT(rendelesek.datum, "%Y-%m-%d") AS datum, rendelesek.statusz, vasarlok.id AS vasarlo_id, vasarlok.nev, vasarlok.email, vasarlok.varos FROM rendelesek JOIN vasarlok ON vasarlok.id = rendelesek.vasarlo_id WHERE rendelesek.id = ?`;
    let [rendeles] = await pool.query(sql, [id]);
    if (rendeles.length === 0) {
        return res.status(404).json({
            hiba: "A rendelés nem található!"
        });
    }
    let tetelekSql = `SELECT termekek.nev AS termek, tetelek.db, tetelek.egysegar, tetelek.db * tetelek.egysegar AS osszeg FROM tetelek JOIN termekek ON termekek.id = tetelek.termek_id WHERE tetelek.rendeles_id = ?`;
    let [tetelek] = await pool.query(tetelekSql, [id]);
    let vegosszeg = 0;
    for (const tetel of tetelek) {
        vegosszeg += Number(tetel.osszeg);
    }
    const eredmeny = {
        id: rendeles[0].id,
        datum: rendeles[0].datum,
        statusz: rendeles[0].statusz,
        vasarlo: {
            id: rendeles[0].vasarlo_id,
            nev: rendeles[0].nev,
            email: rendeles[0].email,
            varos: rendeles[0].varos
        },
        tetelek: tetelek,
        vegosszeg: vegosszeg
    };
    res.json(eredmeny);
});

rendelesekRoutes.post("/", async (req, res) => {
    const { vasarloId, tetelek } = req.body;
    if (!vasarloId || !Array.isArray(tetelek) || tetelek.length === 0) {
        return res.status(400).json({
            hiba: "Hibás rendelési adatok!"
        });
    }
    for (const tetel of tetelek) {
        if (!tetel.termekId || !tetel.db || !Number.isInteger(tetel.db) || tetel.db <= 0) {
            return res.status(400).json({
                hiba: "Hibás tétel!"
            });
        }
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [vasarlo] = await conn.query(`SELECT id FROM vasarlok WHERE id = ?`, [vasarloId]);
        if (vasarlo.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                hiba: "A vásárló nem létezik!"
            });
        }
        const termekAdatok = [];
        for (const tetel of tetelek) {
            const [termek] = await conn.query(`SELECT id, nev, ar FROM termekek WHERE id = ?`, [tetel.termekId]);
            if (termek.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    hiba: `A(z) ${tetel.termekId} azonosítójú termék nem létezik!`
                });
            }
            termekAdatok.push({
                id: termek[0].id,
                nev: termek[0].nev,
                ar: termek[0].ar,
                db: tetel.db
            });
        }
        const [rendeles] = await conn.query(`INSERT INTO rendelesek (vasarlo_id, datum, statusz) VALUES (?, CURDATE(), 'új')`, [vasarloId]);
        const rendelesId = rendeles.insertId;
        for (const termek of termekAdatok) {
            await conn.query(`INSERT INTO tetelek (rendeles_id, termek_id, db, egysegar) VALUES (?, ?, ?, ?)`, [rendelesId, termek.id, termek.db, termek.ar]);
        }
        await conn.commit();
        let [rendelesAdat] = await conn.query(`SELECT r.id, DATE_FORMAT(r.datum, "%Y-%m-%d") AS datum, r.statusz, v.id AS vasarlo_id, v.nev, v.email, v.varos FROM rendelesek r JOIN vasarlok v ON v.id = r.vasarlo_id WHERE r.id = ?`, [rendelesId]);
        let [ujTetelek] = await conn.query(`SELECT t.nev AS termek, tt.db, tt.egysegar, tt.db * tt.egysegar AS osszeg FROM tetelek tt JOIN termekek t ON t.id = tt.termek_id WHERE tt.rendeles_id = ?`, [rendelesId]);
        let vegosszeg = 0;
        for (const tetel of ujTetelek) {
            vegosszeg += Number(tetel.osszeg);
        }
        const eredmeny = {
            id: rendelesAdat[0].id,
            datum: rendelesAdat[0].datum,
            statusz: rendelesAdat[0].statusz,
            vasarlo: {
                id: rendelesAdat[0].vasarlo_id,
                nev: rendelesAdat[0].nev,
                email: rendelesAdat[0].email,
                varos: rendelesAdat[0].varos
            },
            tetelek: ujTetelek,
            vegosszeg: vegosszeg
        };
        res.status(201).json(eredmeny);
    } catch (error) {
        await conn.rollback();
        res.status(500).json({
            hiba: error.message
        });
    } finally {
        conn.release();
    }
});
export default rendelesekRoutes;