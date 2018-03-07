import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {NavigationPathBase} from './navigation-path';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathInternal extends NavigationPathBase<NavigationPathSegment> {

    q?: string; // top level query string
    types?: string[]; // top level query types
}


export interface NavigationPathSegment {

    document: IdaiFieldDocument;
    q?: string;
    types?: Array<string>;
}


export const isSegmentOf
    = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;


export const toDocument = (segment: NavigationPathSegment) => segment.document;


export const toResourceId = (seg: NavigationPathSegment) => seg.document.resource.id;