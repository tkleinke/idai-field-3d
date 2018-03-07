import {IdaiFieldImageRelations} from './idai-field-image-relations';
import {Resource} from 'idai-components-2/core';
import {IdaiFieldImageResourceBase} from "./idai-field-image-resource-base";


export interface IdaiFieldImageResource
    extends Resource, IdaiFieldImageResourceBase {

    relations: IdaiFieldImageRelations;
}