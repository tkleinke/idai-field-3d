import {Component, ElementRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Datastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {PersistenceManager} from 'idai-components-2/persist';
import {Imagestore} from '../imagestore/imagestore';
import {LinkModalComponent} from './link-modal.component';
import {SettingsService} from '../settings/settings-service';
import {ObjectUtil} from '../util/object-util';
import {ImageTypeUtility} from '../docedit/image-type-utility';
import {ImagesState} from './images-state';
import {M} from '../m';
import {ImageGridComponent} from "../imagegrid/image-grid.component";

@Component({
    moduleId: module.id,
    templateUrl: './image-overview.html'
})
/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ImageOverviewComponent {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    protected documents: IdaiFieldImageDocument[];

    public selected: IdaiFieldImageDocument[] = [];

    // TODO move this to image-grid component
    public resourceIdentifiers: string[] = [];

    public constructor(
        private router: Router,
        private datastore: Datastore,
        private modalService: NgbModal,
        private messages: Messages,
        private imagestore: Imagestore,
        private persistenceManager: PersistenceManager,
        private el: ElementRef,
        private settingsService: SettingsService,
        private imageTypeUtility: ImageTypeUtility,
        private imagesState: ImagesState
    ) {
        if (!this.imagesState.getQuery()) this.imagesState.setQuery({ q: '' });

        this.fetchDocuments();
    }

    public onResize() {

        this.imageGrid._onResize(this.el.nativeElement.children[0].clientWidth);
    }

    public refreshGrid() {

        this.fetchDocuments();
    }

    public setQueryString(q: string) {

        this.imagesState.getQuery().q = q;
        this.fetchDocuments();
    }

    /**
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldImageDocument) {

        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }

    public openDeleteModal(modal) {

        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.deleteSelected();
        });
    }

    public openLinkModal() {

        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.updateAndPersistDepictsRelations(this.selected, targetDoc)
                    .then(() => {
                        this.imageGrid.clearSelection();
                    }).catch(msgWithParams => {
                        this.messages.add(msgWithParams);
                    });
            }
        }, (closeReason) => {
        });
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    private fetchDocuments() {

        const query: Query = this.imagesState.getQuery();

        return this.imageTypeUtility.getProjectImageTypeNames().then(imageTypeNames => {
            query.types = imageTypeNames;
            return this.datastore.find(query);
        }).catch(errWithParams => {
            console.error('ERROR with find using query', query);
            if (errWithParams.length == 2) console.error('Cause: ', errWithParams[1]);
        }).then(documents => {
            if (!documents) return;

            this.documents = documents as IdaiFieldImageDocument[];
            this.cacheIdsOfConnectedResources(documents);
            this.imageGrid.calcGrid(this.el.nativeElement.children[0].clientWidth);
        });
    }

    private cacheIdsOfConnectedResources(documents) {

        for (let doc of documents) {
            if (doc.resource.relations['depicts'] && doc.resource.relations['depicts'].constructor === Array)
                for (let resourceId of doc.resource.relations['depicts']) {
                    this.datastore.get(resourceId).then(result => {
                        this.resourceIdentifiers[resourceId] = result.resource.identifier;
                    });
                }
        }
    }

    private deleteSelected() {

        this.deleteImageDocuments(this.selected).then(
            () => {
                this.imageGrid.clearSelection();
                this.fetchDocuments();
            });
    }

    private deleteImageDocuments(documents: Array<IdaiFieldImageDocument>): Promise<any> {
        
        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let document of documents) {
                promise = promise.then(
                    () => this.imagestore.remove(document.resource.id),
                    msgWithParams => reject(msgWithParams)
                ).then(
                    () => this.persistenceManager.remove(document, this.settingsService.getUsername(), [document]),
                    err => reject([M.IMAGESTORE_ERROR_DELETE, document.resource.identifier])
                ).then(() => {
                    this.documents.splice(
                        this.documents.indexOf(document), 1);
                })
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }

    private updateAndPersistDepictsRelations(imageDocuments: Array<IdaiFieldImageDocument>,
                 targetDocument: IdaiFieldDocument): Promise<any> {

        this.resourceIdentifiers[targetDocument.resource.id] = targetDocument.resource.identifier;

        return new Promise<any>((resolve, reject) => {

            let promise: Promise<any> = new Promise<any>((res) => res());

            for (let imageDocument of imageDocuments) {
                const oldVersion = JSON.parse(JSON.stringify(imageDocument));

                const depictsEl = ObjectUtil.takeOrMake(imageDocument,
                    'resource.relations.depicts', []);

                if (depictsEl.indexOf(targetDocument.resource.id) == -1) {
                    depictsEl.push(targetDocument.resource.id);
                }

                promise = promise.then(
                    () => this.persistenceManager.persist(imageDocument, this.settingsService.getUsername(),
                            [oldVersion]),
                    msgWithParams => reject(msgWithParams)
                );
            }

            promise.then(
                () => resolve(),
                msgWithParams => reject(msgWithParams)
            );
        });
    }
}
