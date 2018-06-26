import {Component} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ViewFacade} from '../state/view-facade';
import {ModelUtil} from '../../../core/model/model-util';
import {FlatNavigationPath} from '../state/navpath/flat-navigation-path';


@Component({
    moduleId: module.id,
    selector: 'navigation',
    templateUrl: './navigation.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationComponent {

    public navigationPath: FlatNavigationPath = { segments: [] };


    constructor(public viewFacade: ViewFacade) {

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
        });
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public moveInto = (document: IdaiFieldDocument|undefined) => this.viewFacade.moveInto(document);

    public toggleDisplayHierarchy = () => this.viewFacade.setDisplayHierarchy(!this.viewFacade.getDisplayHierarchy());


    public getSegments(): Array<IdaiFieldDocument> {

        return this.viewFacade.getDisplayHierarchy()
            ? this.navigationPath.segments
            : [];
    }


    public async chooseOperationTypeDocumentOption(document: IdaiFieldDocument) {

        this.viewFacade.selectOperationTypeDocument(document);
        if (!this.viewFacade.getSelectedDocument()) { // if deselection happened during selectMainTypeDocument
            this.viewFacade.setActiveDocumentViewTab(undefined);
        }
    }
}