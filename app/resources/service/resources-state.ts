import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../common/state-serializer';

@Injectable()

/**
 * @author Thomas Kleinke
 */
export class ResourcesState {

    private _: { [viewName: string]: ResourcesViewState };

    constructor(private serializer: StateSerializer) {}

    public initialize(): Promise<any> {

        if (this._) return Promise.resolve();

        return this.serializer.load(StateSerializer.RESOURCES_STATE)
            .then(resourcesStateMap => this._ = resourcesStateMap);
    }

    public setLastSelectedMainTypeDocumentId(viewName: string, id: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mainTypeDocumentId = id;
        this.serializer.store(StateSerializer.RESOURCES_STATE, this._);
    }

    public getLastSelectedMainTypeDocumentId(viewName: string): string {

        return (!this._[viewName]) ? undefined : this._[viewName].mainTypeDocumentId;
    }

    public setLastSelectedMode(viewName: string, mode: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mode = mode;
        this.serializer.store(StateSerializer.RESOURCES_STATE, this._);
    }

    public getLastSelectedMode(viewName: string) {

        return (!this._[viewName]) ? undefined : this._[viewName].mode;
    }

    public setLastQueryString(viewName: string, q: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].q = q;
        this.serializer.store(StateSerializer.RESOURCES_STATE, this._);
    }

    public getLastQueryString(viewName: string) {

        if (!this._) return '';
        return (!this._[viewName] || !this._[viewName].q) ? '' : this._[viewName].q;
    }

    public setLastSelectedTypeFilters(viewName: string, types: string[]) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].types = types;
        this.serializer.store(StateSerializer.RESOURCES_STATE, this._);
    }

    public getLastSelectedTypeFilters(viewName: string): string[] {

        if (!this._) return undefined;
        return (!this._[viewName]) ? undefined : this._[viewName].types;
    }

    public setActiveLayersIds(viewName: string, mainTypeDocumentId: string, activeLayersIds: string[]) {

        if (!this._[viewName]) this._[viewName] = {};
        if (!this._[viewName].layerIds) this._[viewName].layerIds = {};
        this._[viewName].layerIds[mainTypeDocumentId] = activeLayersIds;
        this.serializer.store(StateSerializer.RESOURCES_STATE, this._);
    }

    public getActiveLayersIds(viewName: string, mainTypeDocumentId: string): string[] {

        return (!this._[viewName] || !this._[viewName].layerIds )
            ? undefined : this._[viewName].layerIds[mainTypeDocumentId];
    }

    public removeActiveLayersIds(viewName: string, mainTypeDocumentId: string) {

        if (!this._[viewName] || !this._[viewName].layerIds) return;

        delete this._[viewName].layerIds[mainTypeDocumentId];
        this.serializer.store(StateSerializer.RESOURCES_STATE, this._);
    }

    public clear() {
        this._ = {};
    }
}