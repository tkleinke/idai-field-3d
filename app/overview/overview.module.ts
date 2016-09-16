import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { overviewRouting } from './overview.routing';
import { MapComponent } from './map.component';
import { OverviewComponent } from './overview.component';
import { DocumentViewComponent } from './document-view.component';
import { DocumentEditWrapperComponent } from './document-edit-wrapper.component';
import { IdaiComponents2Module } from 'idai-components-2/idai-components-2';


@NgModule({
    imports: [
        overviewRouting,
        BrowserModule,
        IdaiComponents2Module
    ],
    declarations: [
        MapComponent,
        OverviewComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent
    ],
    providers: []
})

export class OverviewModule {}