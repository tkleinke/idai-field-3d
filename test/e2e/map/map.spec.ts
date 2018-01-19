import {browser, protractor, element, by} from 'protractor';
import {MapPage} from './map.page';
import {ResourcesPage} from '../resources/resources.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {DoceditPage} from '../docedit/docedit.page';
import {NavbarPage} from "../navbar.page";
const EC = protractor.ExpectedConditions;


const delays = require('../config/delays');
const request = require('request');

describe('resources/map --', function() {

    function setPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, delays.shortRest);
            })}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(100,200); })
            .then(() => { return MapPage.clickMap(100,100); });
    }

    function setMultiPolygon() {
        return Promise.resolve()
            .then(() => {
                browser.sleep(3000);
                return MapPage.clickMap(100, 100);
            }).then(() => { return MapPage.clickMap(200, 200); })
            .then(() => { return MapPage.clickMap(100, 200); })
            .then(() => { return MapPage.clickMap(100, 175); })
            .then(() => { return MapPage.clickMap(100, 150); })
            .then(() => { return MapPage.clickMap(100, 100); })
            .then(() => { return MapPage.clickMapOption('add-polygon'); })
            .then(() => { return MapPage.clickMap(300, 300); })
            .then(() => { return MapPage.clickMap(500, 400); })
            .then(() => { return MapPage.clickMap(300, 400); })
            .then(() => { return MapPage.clickMap(300, 350); })
            .then(() => { return MapPage.clickMap(300, 325); })
            .then(() => { return MapPage.clickMap(300, 300); });
    }

    function setPolyline() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, delays.shortRest);
            })}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMap(400,200); });
    }

    function setUnfinishedPolyline() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, delays.shortRest);
            })}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
    }

    function setMultiPolyline() {
        return Promise.resolve()
            .then(() => {
                browser.sleep(1000);
                return MapPage.clickMap(100,100);
            }).then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMapOption('add-polyline'); })
            .then(() => { return MapPage.clickMap(500,200); })
            .then(() => { return MapPage.clickMap(500,100); })
            .then(() => { return MapPage.clickMap(400,300); })
            .then(() => { return MapPage.clickMap(400,400); })
            .then(() => { return MapPage.clickMap(400,400); });
    }

    function setUnfinishedMultiPolyline() {
        return Promise.resolve()
            .then(() => {
                browser.sleep(1000);
                return MapPage.clickMap(100,100);
            }).then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMapOption('add-polyline'); })
            .then(() => { return MapPage.clickMap(500,200); })
            .then(() => { return MapPage.clickMap(500,100); })
            .then(() => { return MapPage.clickMap(400,300); })
            .then(() => { return MapPage.clickMap(400,400); })
    }

    function beginCreateDocWithGeometry(geometry, mapClickCallback) {
        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        return ResourcesPage.clickSelectGeometryType(geometry)
            .then(function() { return mapClickCallback(); });
    }
    
    function createDocWithGeometry(identifier, geometry, mapClickCallback) {
        beginCreateDocWithGeometry(geometry, mapClickCallback).then(
            function() {
                MapPage.clickMapOption('ok');
                DoceditPage.typeInInputField('identifier', identifier);
                ResourcesPage.scrollUp();
                DoceditPage.clickSaveDocument();
            });
    }

    function createDoc(identifier, geometryType, mapClickCallback) {
        if (geometryType) {
            createDocWithGeometry(identifier, geometryType, mapClickCallback)
        } else {
            ResourcesPage.performCreateResource(identifier);
        }
    }
    
    function createDocThenReedit(identifier, geometryType, mapClickCallback) {
        createDoc(identifier, geometryType, mapClickCallback);
        DocumentViewPage.clickReeditGeometry();
    }

    let index = 0;

    beforeAll(() => {

        ResourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
        browser.sleep(750);
    });


    beforeEach(() => {
        if (index > 0) {
            NavbarPage.performNavigateToSettings();
            request.post('http://localhost:3003/reset', {form:{key:'value'}});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 4);
            NavbarPage.clickNavigateToExcavation();
        }
        index++;
    });


    it('create a new item with point geometry', () => {

        createDoc('doc','point', function() { return MapPage.setMarker(100, 100); });
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Punkt');
        });
    });


    it('create a new item with polyline geometry', () => {
        createDoc('doc', 'polyline', setPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });


    it('create a new item with multipolyline geometry', () => {
        createDoc('doc', 'polyline', setMultiPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolyline');
        });
    });


    it('create a new item with polygon geometry', () => {
        createDoc('doc', 'polygon', setPolygon);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });
    });


    it('create a new item with multipolygon geometry', () => {
        createDoc('doc', 'polygon', setMultiPolygon);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolygon');
        });
    });


    it('delete a point geometry', () => {

        createDocThenReedit('doc', 'point', function() { return MapPage.setMarker(100, 100); });
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('delete a polyline geometry', () => {

        createDocThenReedit('doc', 'polyline', setPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('delete a polygon geometry', () => {

        createDocThenReedit('doc', 'polygon', setPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('delete single polygons of a multipolygon', () => {

        createDocThenReedit('doc', 'polygon', setMultiPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });

        DocumentViewPage.clickReeditGeometry();
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        })
    });


    it('delete single polylines of a multipolyline', () => {

        createDocThenReedit('doc', 'polyline', setMultiPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });

        DocumentViewPage.clickReeditGeometry();
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('create a point geometry later', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('point');
        MapPage.setMarker(100, 100);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Punkt');
        });
    });


    it('create a polyline geometry later', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polyline').then(setPolyline);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });


    it('create a multipolyline geometry later', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polyline').then(setMultiPolyline);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolyline');
        });
    });


    it('create a polygon geometry later', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polygon').then(setPolygon);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });
    });


    it('create a multipolygon geometry later', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polygon').then(setMultiPolygon);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolygon');
        });
    });


    it('cancel creating a point geometry', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('point');
        MapPage.setMarker(100, 100);
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('cancel creating a polyline geometry', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polyline').then(setPolyline);
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('cancel creating a polygon geometry', () => {

        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polygon').then(setPolygon);
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('cancel creating a geometry by deselecting the resource', () => {

        ResourcesPage.performCreateResource('doc1');
        ResourcesPage.performCreateResource('doc2');
        DocumentViewPage.clickCreateGeometry('point');
        MapPage.setMarker(100, 100);
        ResourcesPage.clickSelectResource('doc1');
        ResourcesPage.clickSelectResource('doc2');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });


    it('cancel deleting a point geometry', () => {

        createDocThenReedit('doc', 'point', function() { return MapPage.setMarker(100, 100); });
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Punkt');
        });
    });


    it('cancel deleting a polyline geometry', () => {

        createDocThenReedit('doc', 'polyline', setPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });


    it('cancel deleting a polygon geometry', () => {

        createDocThenReedit('doc', 'polygon', setPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });
    });


    it('abort item creation completely when aborting geometry editing', () => {

        beginCreateDocWithGeometry('point', function() { return MapPage.setMarker(100, 100); });
        MapPage.clickMapOption('abort');
        expect(browser.getCurrentUrl()).toContain('resources');
        expect(browser.getCurrentUrl()).not.toContain('edit');
    });


    it('autofinish polyline geometry', () => {

        createDoc('doc', 'polyline', setUnfinishedPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });


    it('autofinish multipolyline geometry', () => {

        createDoc('doc', 'polyline', setUnfinishedMultiPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolyline');
        });
    });
});