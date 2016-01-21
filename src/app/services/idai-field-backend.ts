import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Utils} from '../utils';
import {Observable} from "rxjs/Observable";
import {Response} from "angular2/http";
import {MyObserver} from "../my-observer";

/**
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class IdaiFieldBackend {

    private typeName  : string = "objects";
    private hostUrl   : string;
    private indexName : string;
    private connected : boolean;
    private observers : MyObserver[] = [];

    public constructor(private http: Http) {
    }

    public subscribe(observer: MyObserver) {
        this.observers.push(observer);
    }

    public setHostName(hostName: string) {
        this.hostUrl = hostName;
    }

    public setIndexName(indexName:string):void {
        this.indexName= indexName;
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public checkConnection(): Promise<boolean> {

        return new Promise((resolve, reject) => {

            this.http.get(this.hostUrl + '/idaifield')             
                .subscribe(
                    data => {
                        this.connected = true;
                        resolve(true);
                    },
                     err => {
                        this.connected = false;
                        this.notifyObservers();
                        resolve(false);
                    }
                )
        });
    }

    /**
     * @param object
     * @return new IdaiFieldObject without the properties which we don't want
     *   to send to the backend.
     */
    private filterUnwantedProps(object:IdaiFieldObject) : IdaiFieldObject {
        var o = Utils.clone(object);
        delete o.synced;
        return o;
    }

    private performPost(object:IdaiFieldObject) : Observable<Response> {

        return this.http.post(this.hostUrl + '/' + this.indexName + '/'
            + this.typeName + '/' + object._id,
            JSON.stringify(object))
    }

    public save(object:IdaiFieldObject):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.performPost(this.filterUnwantedProps(object))
            .subscribe(
                () => resolve(object),
                err => {
                    this.checkConnection();
                    reject();
                }
            );
        });
    }

    private notifyObservers(): void {

        for (var observer of this.observers) {
            observer.notify();
        }
    }

}