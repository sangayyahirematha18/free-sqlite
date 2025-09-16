declare namespace API {
    interface IMessage {
        hashkey?: string,
        dbPath?:string,
        id?: string,
        method?: string,
        data?: any,
        notification?: boolean,
        response?: boolean,
        request?: boolean,
    }
    interface ResponseResult {
        response?: boolean;
        id?: string;
        data?: any;
        ok?: boolean;
    }
}
