import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute, Params} from "@angular/router";
import {OverviewComponent} from "./overview.component";
import {Document} from "idai-components-2/idai-components-2";
import {PersistenceManager,ReadDatastore,
    ProjectConfiguration, ConfigLoader} from "idai-components-2/idai-components-2";
import {IdaiFieldGeometry} from "../model/idai-field-geometry";

@Component({
    moduleId: module.id,
    templateUrl: './map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class MapWrapperComponent implements OnInit, OnDestroy {

    private activeDoc;
    private activeType;
    private docs;
    private projectConfiguration: ProjectConfiguration;
    private menuMode: string; // view | geometryEdit
    private editMode: string; // polygon | point | none

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private datastore: ReadDatastore,
        private overviewComponent: OverviewComponent,
        private configLoader: ConfigLoader,
        private persistenceManager: PersistenceManager
    ) {
        this.configLoader.configuration().subscribe((result) => {
            if(!result.error) {
                this.projectConfiguration = result.projectConfiguration;
                this.persistenceManager.setRelationsConfiguration(result.relationsConfiguration);
            }
        });
    }


    private evalParams(routeParams,callback) {

        routeParams.forEach((params:Params) => {
            var type = undefined;
            var id = undefined;
            if (params['id'] && params['id'].indexOf('new') > -1) {
                type = params['id'].substring(params['id'].indexOf(":") + 1);
            } else {
                id = params['id'];
            }
            callback(params['menuMode'],params['editMode'],id,type);
        });
    }

    ngOnInit(): void {

        this.overviewComponent.getDocuments().subscribe(result => {
           this.docs = result;
        });

        this.evalParams(this.route.params,function(menuMode,editMode,id,type){

            if (menuMode) {
                this.menuMode = menuMode;
            } else {
                this.menuMode = "view";
            }

            if (editMode) {
                this.editMode = editMode;
                this.removeEmptyDocument();
            } else {
                this.editMode = "none";
            }

            if (id) {
                if (type) {
                    this.overviewComponent.createNewDocument(type);
                } else {
                    this.datastore.get(id).then(document => {
                        this.activeDoc = document;
                        this.activeType = this.projectConfiguration.getLabelForType(document.resource.type);
                        this.overviewComponent.setSelected(<Document>document);
                    });
                }
            } else {
                this.activeDoc = null;
                this.overviewComponent.setSelected(null);
            }
        }.bind(this));
    }
    
    public selectDocument(document: Document) {
        
        if (document) {
            this.router.navigate(['resources', { id: document.resource.id }]);
        } else {
            this.router.navigate(['resources']);
        }
    }
    
    public quitEditing(geometry: IdaiFieldGeometry) {

        if (geometry) {
            this.overviewComponent.getSelected().resource.geometries = [ geometry ];
        } else if (geometry === null) {
            delete this.overviewComponent.getSelected().resource.geometries;
        }

        if (this.overviewComponent.getSelected().resource.id) {
            if (geometry !== undefined) {
                this.save();
            }
            this.router.navigate(['resources', {id: this.overviewComponent.getSelected().resource.id}]);
        } else {
            this.router.navigate(['resources', 'selected', 'edit']);
        }
    }
    
    ngOnDestroy(): void {

        this.removeEmptyDocument();
    }

    private removeEmptyDocument() {
        
        var selectedDocument = this.overviewComponent.getSelected();
        if (selectedDocument && !selectedDocument.resource.id && !selectedDocument.resource.geometries) {
            this.overviewComponent.remove(selectedDocument);
        }
    }

    private save() {

        this.persistenceManager.setOldVersion(this.overviewComponent.getSelected());

        this.persistenceManager.persist(this.overviewComponent.getSelected()).then(
            () => {
                this.overviewComponent.getSelected()['synced'] = 0;
            },
            errors => { console.log(errors); });
    }
}
