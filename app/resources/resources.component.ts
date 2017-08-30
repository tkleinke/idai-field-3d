import {Component, AfterViewChecked, Renderer} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Location} from '@angular/common';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Query, DocumentChange} from 'idai-components-2/datastore';
import {Document, Action} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader, ViewDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {DoceditComponent} from '../docedit/docedit.component';
import {ViewUtility} from '../util/view-utility';
import {Loading} from '../widgets/loading';
import {ResourcesState} from './resources-state';
import {M} from '../m';


@Component({
    moduleId: module.id,
    templateUrl: './resources.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ResourcesComponent implements AfterViewChecked {

    public view: ViewDefinition;
    public mainTypeLabel: string;
    public mode: string; // 'map' or 'list'
    public editGeometry: boolean = false;

    public query: Query;
    public filterTypes: string[];

    public documents: Array<Document>;
    public selectedDocument: Document;

    public projectDocument: IdaiFieldDocument;
    public mainTypeDocuments: Array<IdaiFieldDocument>;
    public selectedMainTypeDocument: IdaiFieldDocument;

    public ready: boolean = false;

    private newDocumentsFromRemote: Array<Document> = [];
    private scrollTarget: IdaiFieldDocument;

    private clickEventObservers: Array<any> = [];

    private subscription;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private location: Location,
                private renderer: Renderer,
                private datastore: IdaiFieldDatastore,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor,
                private messages: Messages,
                private configLoader: ConfigLoader,
                private viewUtility: ViewUtility,
                private loading: Loading,
                private resourcesState: ResourcesState
    ) {
        this.route.params.subscribe(params => {

            this.ready = false;

            this.selectedDocument = undefined;
            this.selectedMainTypeDocument = undefined;
            this.mainTypeDocuments = undefined;
            this.editGeometry = false;

            this.setupViewFrom(params)
                .then(() => this.initialize())
                .catch(msgWithParams => {
                    if (msgWithParams) this.messages.add(msgWithParams)
                });
        });

        this.subscription = datastore.documentChangesNotifications().subscribe(documentChange => {
            this.handleChange(documentChange);
        });

        this.initializeClickEventListener();
    }

    ngOnDestroy() {

        this.subscription.unsubscribe();
    }

    ngAfterViewChecked() {
        if (this.scrollTarget) {
            if (this.scrollToDocument(this.scrollTarget)) {
                this.scrollTarget = undefined;
            }
        }
    }

    private setupViewFrom(params: Params): Promise<any> {

        if (params['id']) this.selectDocumentFromParams(params['id'], params['tab']);

        this.location.replaceState('resources/' + params['view']);

        return (!this.view || params['view'] != this.view.name)
            ? this.initializeView(params['view']) : Promise.resolve();
    }

    public stop() {

        this.ready = false;
    }

    private initializeMode() {

        if (this.resourcesState.getLastSelectedMode(this.view.name)) {
            this.mode = this.resourcesState.getLastSelectedMode(this.view.name);
        } else {
            this.mode = 'map';
            this.resourcesState.setLastSelectedMode(this.view.name, 'map');
        }
    }

    public initialize(): Promise<any> {

        this.loading.start();

        return this.resourcesState.initialize()
            .then(() => {
                this.initializeQuery();
                this.initializeMode();
                return this.populateProjectDocument();
            }).then(() => this.populateMainTypeDocuments())
            .then(() => this.populateDocumentList())
            .then(() => (this.ready = true) && this.loading.stop());
    }

    private initializeView(viewName: string): Promise<any> {

        return this.configLoader.getProjectConfiguration().then(
            projectConfiguration => {
                this.view = projectConfiguration.getView(viewName);
                this.mainTypeLabel = projectConfiguration.getLabelForType(this.view.mainType);
            }
        ).catch(() => Promise.reject(null));
    }

    private selectDocument(document) {
        if (document && document.resource.type == this.view.mainType) {
            this.selectedMainTypeDocument = document;
        } else {
            this.selectedDocument = document;
            this.scrollTarget = document;
        }
    }

    private selectDocumentFromParams(id: string, tab: string) {

        this.datastore.get(id).then(
            document => tab ? this.editDocument(document, tab) : this.setSelected(document),
            () => this.messages.add([M.DATASTORE_NOT_FOUND])
        );
    }

    public selectMainTypeDocument(document: IdaiFieldDocument) {

        this.selectedMainTypeDocument = document;
        this.resourcesState.setLastSelectedMainTypeDocumentId(this.view.name,
            this.selectedMainTypeDocument.resource.id);

        if (this.selectedDocument &&
            ResourcesComponent.getMainTypeDocumentForDocument(
                this.selectedDocument, this.mainTypeDocuments) != this.selectedMainTypeDocument) {

            this.setSelected(undefined);
        }

        this.populateDocumentList();
    }

    private handleChange(documentChange: DocumentChange) {

        if (documentChange.type == 'deleted') {
            console.debug('unhandled deleted document');
            return;
        }
        let changedDocument: Document = documentChange.document;

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;
        if (ResourcesComponent.isExistingDoc(changedDocument, this.documents)) return;

        let oldDocuments = this.documents;
        this.populateDocumentList().then(() => {
            for (let doc of this.documents) {
                if (oldDocuments.indexOf(doc) == -1 && this.isRemoteChange(doc)) {
                    this.newDocumentsFromRemote.push(doc);
                }
            }
        });
    }

    private initializeClickEventListener() {

        this.renderer.listenGlobal('document', 'click', event => {
            for (let clickEventObserver of this.clickEventObservers) {
                clickEventObserver.next(event);
            }
        });
    }

    public listenToClickEvents(): Observable<Event> {

        return Observable.create(observer => {
            this.clickEventObservers.push(observer);
        });
    }

    /**
     * @param documentToSelect the object that should get selected
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (this.editGeometry && documentToSelect != this.selectedDocument) this.endEditGeometry();

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        this.setSelected(documentToSelect);
    }

    public deselect() {

        this.selectedDocument = undefined;
    }

    public jumpToRelationTarget(documentToSelect: IdaiFieldDocument) {

        this.viewUtility.getViewNameForDocument(documentToSelect)
            .then(viewName => {
                if (viewName != this.view.name) {
                    return this.router.navigate(['resources', viewName, documentToSelect.resource.id]);
                } else {
                    this.select(documentToSelect);
                }
            });
    }

    public setSelected(documentToSelect: Document): Document {

        this.selectedDocument = documentToSelect;
        if (this.selectedDocument) this.selectLinkedMainTypeDocumentForSelectedDocument();

        return this.selectedDocument;
    }

    public getSelected(): Document {

        return this.selectedDocument;
    }

    private selectLinkedMainTypeDocumentForSelectedDocument() {

        if (!this.mainTypeDocuments || this.mainTypeDocuments.length == 0) return;

        let mainTypeDocument = ResourcesComponent.getMainTypeDocumentForDocument(
            this.selectedDocument, this.mainTypeDocuments);

        if (mainTypeDocument != this.selectedMainTypeDocument) {
            this.selectedMainTypeDocument = mainTypeDocument;
            this.populateDocumentList();
        }
    }

    public setQueryString(q: string) {

        this.query.q = q;
        this.populateDocumentList();
    }

    public setQueryTypes(types: string[]) {

        types && types.length > 0 ? this.query.types = types : delete this.query.types;

        this.resourcesState.setLastSelectedTypeFilters(this.view.name, types);
        this.filterTypes = types;

        this.populateDocumentList();
    }

    private initializeQuery() {

        this.query = { q: '' };
        this.filterTypes = this.resourcesState.getLastSelectedTypeFilters(this.view.name);
        if (this.filterTypes && this.filterTypes.length > 0) this.query.types = this.filterTypes;
    }

    public remove(document: Document) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }

    private populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]));
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    private populateDocumentList() {

        this.newDocumentsFromRemote = [];

        if (!this.selectedMainTypeDocument) {
            this.documents = [];
            return Promise.resolve();
        }

        return this.fetchDocuments(ResourcesComponent.makeDocsQuery(this.query,
                    this.selectedMainTypeDocument.resource.id))
            .then(documents => this.documents = documents);
    }

    private populateMainTypeDocuments(): Promise<any> {

        if (!this.view) return Promise.resolve();

        return this.fetchDocuments(
                ResourcesComponent.makeMainTypeQuery(this.view.mainType))
            .then(documents => {
                this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
                return this.setSelectedMainTypeDocument();
            });
    }

    private fetchDocuments(query: Query): Promise<any> {

        this.loading.start();
        return this.datastore.find(query)
            .catch(errWithParams => this.handleFindErr(errWithParams, query))
            .then(documents => {
                this.loading.stop(); return documents;
            });
    }

    private setSelectedMainTypeDocument(): Promise<any> {

        if (this.mainTypeDocuments.length == 0) {
            this.selectedMainTypeDocument = undefined;
            return Promise.resolve();
        }

        if (this.selectedDocument) {
            this.selectedMainTypeDocument =
                ResourcesComponent.getMainTypeDocumentForDocument(
                    this.selectedDocument, this.mainTypeDocuments
                );
            if (!this.selectedMainTypeDocument) this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            return Promise.resolve();
        }

        const mainTypeDocumentId = this.resourcesState.getLastSelectedMainTypeDocumentId(this.view.name);
        if (!mainTypeDocumentId) {
            this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            return Promise.resolve();
        } else {
            return this.datastore.get(mainTypeDocumentId)
                .then(document => this.selectedMainTypeDocument = document as IdaiFieldDocument);
        }
    }

    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.removeEmptyDocuments();
        this.selectedDocument = newDocument;

        if (geometryType == 'none') this.editDocument();
        else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.editGeometry = true;
            this.mode = 'map';
        }

        if (newDocument.resource.type != this.view.mainType) {
            this.documents.unshift(<Document> newDocument);
        }
    }

    public editDocument(document: Document = this.selectedDocument, activeTabName?: string) {

        this.editGeometry = false;
        if (document != this.selectedDocument && document != this.selectedMainTypeDocument) this.setSelected(document);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });

        doceditRef.result.then(result => {
                this.populateMainTypeDocuments()
                    .then(() => this.populateDocumentList())
                    .then(() => this.selectDocument(result.document));
            }, closeReason => {
                this.documentEditChangeMonitor.reset();
                this.removeEmptyDocuments();
                if (closeReason == 'deleted') {
                    this.selectedDocument = undefined;
                    if (document == this.selectedMainTypeDocument) {
                        this.resourcesState.removeActiveLayersIds(this.view.name,
                            this.selectedMainTypeDocument.resource.id);
                        return this.populateMainTypeDocuments()
                            .then(() => this.populateDocumentList());
                    }
                    this.populateDocumentList();
                }
            });

        doceditRef.componentInstance.setDocument(document);
        if (activeTabName) doceditRef.componentInstance.setActiveTab(activeTabName);
    }

    public startEditGeometry() {

        this.editGeometry = true;
    }

    public endEditGeometry() {

        this.editGeometry = false;
        this.populateDocumentList();
    }

    public createGeometry(geometryType: string) {

        this.selectedDocument.resource['geometry'] = { 'type': geometryType };
        this.startEditGeometry();
    }

    public isNewDocumentFromRemote(document: Document): boolean {

        return this.newDocumentsFromRemote.indexOf(document) > -1;
    }

    public removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }

    public isRemoteChange(changedDocument: Document): boolean {

        const latestAction: Action =
            (changedDocument.modified && changedDocument.modified.length > 0)
            ? changedDocument.modified[changedDocument.modified.length - 1]
            : changedDocument.created;

        return latestAction && latestAction.user != this.settingsService.getUsername();
    }

    public solveConflicts(doc: IdaiFieldDocument) {

        this.editDocument(doc, 'conflicts');
    }

    public startEdit(doc: IdaiFieldDocument) {

        this.editDocument(doc);
    }

    public setScrollTarget(doc: IdaiFieldDocument) {

        this.scrollTarget = doc;
    }

    private scrollToDocument(doc: IdaiFieldDocument) : boolean {
        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            return true;
        }
        return false;  
    }

    public setMode(mode: string) {

        this.resourcesState.setLastSelectedMode(this.view.name, mode);

        this.loading.start();
        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.removeEmptyDocuments();
            this.mode = mode;
            this.editGeometry = false;
            this.loading.stop();
        }, 1);
    }

    private removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }

    private handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
        this.messages.add([M.ALL_FIND_ERROR]);
    }

    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) return true;
        }
    }

    private static getMainTypeDocumentForDocument(document: Document, mainTypeDocuments): IdaiFieldDocument {

        if (!document.resource.relations['isRecordedIn']) return undefined;

        for (let documentId of document.resource.relations['isRecordedIn']) {
            for (let mainTypeDocument of mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument;
            }
        }
    }

    private static makeDocsQuery(query: Query, mainTypeDocumentResourceId: string): Query {

        const clonedQuery = JSON.parse(JSON.stringify(query));
        clonedQuery.constraints = { 'resource.relations.isRecordedIn': mainTypeDocumentResourceId };
        return clonedQuery;
    }

    private static makeMainTypeQuery(mainType: string): Query {

        return { types: [mainType] };
    }
}
