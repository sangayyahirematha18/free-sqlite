import logOutput from "../libs/log.service";
import { errorCode } from "../errorCode";
import { sysDbDir, createSysDir } from "../libs/utils";

const md5 = require('md5');
const sqlite3 = require('../sqlite3/lib/sqlite3').verbose();

const getDbInstance = async function (path:string) {
    return new Promise((resolve, reject)=>{
        let sysInstance: any;
        sysInstance = new sqlite3.Database(path, (err: any)=>{
            if (err) {
                logOutput.error(err);
                resolve({ success: false });
            } else {
                resolve({ success: true, db:  sysInstance});
            }
        });
    });
};

class DbPool {
    private static instance: DbPool;
    private dbMap: Map<string, any> = new Map();
    public sysDbInstance: any;
    private constructor() {
        createSysDir();
    }
    public static getInstance(): DbPool {
        if (!DbPool.instance) {
            DbPool.instance = new DbPool();
        }
        return DbPool.instance;
    }

    private closeSysDb(){
        if(this.sysDbInstance) {
            this.sysDbInstance.close();
            this.sysDbInstance = null;
        }
    }

    private async initSysDb() {
        if(!this.sysDbInstance) {
            const instanceResult: any = await getDbInstance(sysDbDir());
            if(instanceResult.success) {
                this.sysDbInstance = instanceResult.db;
                this.addDefaultTables();
            }
        }
    }

    private async addDefaultTables() {
        /**
         * 创建用户收藏表
         * 收藏的SQL语句
         * priority: 优先级，数字越大优先级越高
         */
        this.sysDbInstance.run(`
            CREATE TABLE IF NOT EXISTS 
                t_sys_user_favorites(
                fid varchar(38) primary key,
                name text,
                sqlStr text,
                createAt varchar(20),
                updateAt varchar(20),
                priority int)
        `);
    }

    public async sysQuery(sqlStr: string, paramArray: any) {
        console.log('Query SQL:', sqlStr);
        console.log('Query param:', paramArray);
        if(!this.sysDbInstance) {
            await this.initSysDb();
        }
        return new Promise((resolve, reject) => {
            this.sysDbInstance.serialize(async () => {
                this.sysDbInstance.all(sqlStr, paramArray, function (err: any, rows: any) {
                    // console.log('Query rows:', rows)
                    if (err) {
                        logOutput.error(err);
                        console.error('Query Error:', err);
                        resolve([]);
                        return;
                    }
                    resolve(rows);
                });
            });
        });
    }

    public async getDb(dbHash: string, path?: string) {
        if (this.dbMap.has(dbHash)) {
            return this.dbMap.get(dbHash).db;
        } else {
            if (!path) {
                return null;
            }
            const db = await this.addDb(path);
            return db;
        }
    }

    public async addDb(path: string) {
        const dbHash = md5(path);
        if (this.dbMap.has(dbHash)) {
            return this.dbMap.get(dbHash).db;
        }
        const getInstanceResult: any = await getDbInstance(path);
        if (!getInstanceResult.success) {
            return null;
        }
        this.dbMap.set(dbHash, { db: getInstanceResult.db, path});
        return getInstanceResult.db;
    }

    public closeDb(dbHash: string) {
        if (this.dbMap.has(dbHash)) {
            const db = this.dbMap.get(dbHash);
            db.close();
            this.dbMap.delete(dbHash);
        }
    }

    public closeAllDbs() {
        this.dbMap.forEach((dbInfo, dbHash) => {
            dbInfo.db.close();
            this.dbMap.delete(dbHash);
        });
    }

    public async runQuery(dbHash: string, sql: string, params: any = {}, path?: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const db: any = await this.getDb(dbHash, path);
            if (!db) {
                logOutput.error('Database not opened:', dbHash);
                resolve({ success: false, errorCode: errorCode.database_not_opened });
                return;
            }
            db.all(sql, params, (err: any, rows: any[]) => {
                if (err) {
                    logOutput.error(err);
                    resolve({ errorCode: errorCode.db_quey_error, data: [], error: err });
                } else {
                    resolve({ errorCode: 200, data: rows});
                }
            });
        });
    }
}

export default DbPool.getInstance();
