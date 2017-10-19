import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Datastore} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MainTypeManager} from './main-type-manager';
import {ViewManager} from './view-manager';
import {DocumentsManager} from './documents-manager';
import {ResourcesState} from './resources-state';
import {ViewUtility} from '../../common/view-utility';
import {Loading} from '../../widgets/loading';
import {SettingsService} from '../../settings/settings-service';
import {StateSerializer} from '../../common/state-serializer';
import {M} from '../../m';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ViewFacade {


    private viewManager: ViewManager;
    private mainTypeManager: MainTypeManager;
    private documentsManager: DocumentsManager;

    private projectDocument: IdaiFieldDocument;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: Datastore,
        private loading: Loading,
        private settingsService: SettingsService,
        private stateSerializer: StateSerializer
    ) {
        this.viewManager = new ViewManager(
            new ViewUtility(
                projectConfiguration,
                datastore
            ),
            projectConfiguration,
            new ResourcesState(
                stateSerializer
            )
        );
        this.mainTypeManager = new MainTypeManager(
            datastore,
            this.viewManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            loading,
            settingsService,
            this.viewManager,
            this.mainTypeManager
        );
    }

    
    public init() {

        return this.mainTypeManager.init();
    }


    public getView() {

        return this.viewManager.getView();
    }


    public getMainTypeDocumentLabel(document) {

        return this.viewManager.getMainTypeDocumentLabel(document);
    }


    public getMainTypeLabel() {

        return this.viewManager.getMainTypeLabel();
    }


    public deselect() {

        return this.documentsManager.deselect();
    }


    public getMode() {

        return this.viewManager.getMode();
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    public getProjectDocument() {

        return this.projectDocument;
    }


    public handleMainTypeDocumentOnDeleted(document: Document) {

        this.viewManager.removeActiveLayersIds(this.mainTypeManager.selectedMainTypeDocument.resource.id);
        this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
        return this.populateMainTypeDocuments();
    }


    public setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds) {

        return this.viewManager.setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds);
    }


    public getActiveLayersIds(mainTypeDocumentResourceId) {

        return this.viewManager.getActiveLayersIds(mainTypeDocumentResourceId);
    }


    public getSelectedMainTypeDocument() {

        return this.mainTypeManager.selectedMainTypeDocument;
    }


    public getMainTypeDocuments() {

        return this.mainTypeManager.mainTypeDocuments;
    }


    public getFilterTypes() {

        return this.viewManager.getFilterTypes();
    }


    public getQueryString() {

        return this.viewManager.getQueryString();
    }


    public setMode(mode) {

        this.viewManager.setMode(mode);
    }


    public setSelectedDocumentById(id) {

        return this.documentsManager.setSelectedById(id);
    }


    public isNewDocumentFromRemote(document: Document) {

        return this.documentsManager.isNewDocumentFromRemote(document);
    }


    public remove(document: Document) {

        return this.documentsManager.remove(document);
    }


    public getSelectedDocument() {

        return this.documentsManager.getSelectedDocument();
    }


    /**
     * Sets the this.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.selectedDocument is part of the search hits of the document list
     * on the left hand side in the map view.
     *
     * @param documentToSelect exits immediately if this is
     *   a) this.selectedDocument or
     *   b) this.mainTypeManager.selectedMainTypeDocument or
     *   c) undefined
     * @returns {Document}
     */
    public setSelectedDocument(document) {

        return this.documentsManager.setSelected(document);
    }


    public getDocuments() {

        return this.documentsManager.getDocuments();
    }


    public setQueryString(q) { // TODO make unique access points: setQuery, getQuery, get rid of the other methods

        return this.documentsManager.setQueryString(q);
    }


    public setQueryTypes(types) {

        return this.documentsManager.setQueryTypes(types);
    }


    public getCurrentFilterType() {

        return this.viewManager.getCurrentFilterType();
    }


    public selectMainTypeDocument(mainTypeDoc) {

        return this.mainTypeManager.selectMainTypeDocument(mainTypeDoc);
    }


    public populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject(
                [M.DATASTORE_NOT_FOUND] // TODO do not return a key of M but instead some errWithParams
            ));
    }


    public isRecordedInSelectedMainTypeDocument(document: Document): boolean { // TODO remove param and use selecteDocument

        return this.mainTypeManager.isRecordedInSelectedMainTypeDocument(document);
    }


    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     *
     * @returns {Promise<any>}
     */
    public populateMainTypeDocuments() {

        return this.mainTypeManager.populateMainTypeDocuments();
    }


    public setupViewFrom(params) {

        return this.viewManager.setupViewFrom(params);
    }


    public getViewNameForDocument(document: Document): Promise <string> {

        return this.viewManager.getViewNameForDocument(document);
    }


    public getMainTypeHomeViewNameForMainTypeName(mainTypeName: string): string {

        return this.viewManager.getMainTypeHomeViewNameForMainTypeName(mainTypeName);
    }
}