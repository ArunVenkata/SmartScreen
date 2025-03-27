import { Injectable } from '@angular/core';
import { StorageKeys } from '../storage-keys';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    get(key: StorageKeys, def: any = null) {
        const data = localStorage.getItem(key.toString())
        if (!data){
            return def
        }
        try{
            return JSON.parse(data);
        }catch(e){
            return def
        }
    }
    set(key: StorageKeys, value: any) {
        console.log("SETTING", key.toString(), value);
        localStorage.setItem(key.toString(), value);
    }
}