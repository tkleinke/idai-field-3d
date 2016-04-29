import {Component, OnInit, Inject, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef} from 'angular2/core';
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "./object-edit.component";
import {ObjectList} from "../services/object-list";
import {ProjectConfiguration} from "../model/project-configuration";
import {Http} from "angular2/http";
import {Messages} from "../services/messages";
import {ConfigLoader} from "../services/config-loader";
import {M} from "../m";

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent],
    providers: [ObjectList]
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    /**
     * The object currently selected in the list and shown in the edit component.
     */
    private selectedObject: IdaiFieldObject;
    private projectConfiguration: ProjectConfiguration;

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
        private objectList: ObjectList,
        private configLoader: ConfigLoader,
        private messages: Messages) {
    }

    private validateAndSave(selectedObject,cb) {
        if (!selectedObject) return cb(this)

        this.messages.delete(M.OBJLIST_IDEXISTS);
        this.messages.delete(M.OBJLIST_IDMISSING);

        this.objectList.validateAndSave(selectedObject, true).then((result)=>{
            cb(this)
        },(err)=>{
            this.messages.add(err,'danger')
            cb(this)
        })

    }
    
    public onSelect(object: IdaiFieldObject) {
        this.validateAndSave(this.selectedObject,function(this_){
            this_.selectedObject = object;
        });
    }

    public onCreate() {
        this.validateAndSave(this.selectedObject,function(this_){
            var newObject = {};
            this_.objectList.getObjects().unshift(newObject);
            this_.selectedObject = newObject;
        });
    }

    public ngOnInit() {
        this.configLoader.getProjectConfiguration().then((dmc)=>{
            this.projectConfiguration=dmc;
            if (this.config.environment == "test") {
                setTimeout(() => this.fetchObjects(), 500);
            } else {
                this.fetchObjects();
            }
        });
    }

    onKey(event:any) {

        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        }
    }

    private fetchObjects() {

        this.datastore.all({}).then(objects => {
            this.objectList.setObjects(objects);
        }).catch(err => console.error(err));
    }
}
