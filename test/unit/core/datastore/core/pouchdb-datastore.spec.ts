import {PouchdbDatastore} from '../../../../../app/core/datastore/core/pouchdb-datastore';
import {AppState} from '../../../../../app/core/settings/app-state';
import {Document, DatastoreErrors} from 'idai-components-2/core';
import {Static} from '../../../static';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('PouchdbDatastore', () => {

    let datastore: PouchdbDatastore;
    let pouchdbProxy: any;


    function createPouchdbDatastore() {


        const appState = new AppState();

        let idGenerator = jasmine.createSpyObj('idGenerator', ['generateId']);
        idGenerator.generateId.and.returnValue(1);


        pouchdbProxy = jasmine.createSpyObj('pouchdbProxy', ['get', 'put', 'remove']);
        pouchdbProxy.put.and.callFake((arg) => {
           arg['_rev'] = '1';
           return Promise.resolve(arg);
        });
        pouchdbProxy.get.and.callFake((arg) => {
            return Promise.resolve({resource: {
                id: arg, type: 'some', relations: []}, created: {date:'2011/01/01'},
                modified: [{date:'2011/01/01'}]
            });
        });
        pouchdbProxy.remove.and.returnValue(Promise.resolve(undefined));

        datastore = new PouchdbDatastore(
            pouchdbProxy,
            appState,
            idGenerator,
            false);
    }



    beforeEach(() => createPouchdbDatastore());


    const expectErr = function(promise, expectedMsgWithParams, done) {

        promise().then(
            result => {
                fail('rejection with '+ expectedMsgWithParams
                    + ' expected but resolved with ' + result);
                done();
            },
            msgWithParams => {
                expect(msgWithParams).toEqual(expectedMsgWithParams);
                done();
            }
        );
    };


    // create

    it('create an id', async done => {

        try {
            const result = await datastore.create(Static.doc('sd1'), 'u');
            expect(result.resource.id).toBe(1 as any);
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('should create a document and take the existing resource.id', async done => {

        let called = false;
        pouchdbProxy.get.and.callFake((arg) => {
            if (!called) {
                called = true;
                return Promise.reject(undefined);
            }
            return Promise.resolve({resource: {
                    id: arg, type: 'some', relations: []}, created: {date:'2011/01/01'},
                modified: [{date:'2011/01/01'}]
            });
        });


        const docToCreate: Document = Static.doc('sd1');
        docToCreate.resource.id = 'a1';

        await datastore.create(docToCreate, 'u');
        // this step was added to adress a problem where a document
        // with an existing resource.id was stored but could not
        // get refreshed later
        await datastore.fetch(docToCreate.resource.id);
        // and the same may occur on get
        try {
            const createdDoc = await datastore.fetch(docToCreate.resource.id) as Document;
            expect(createdDoc.resource.id).toBe('a1');
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('should not create a document with the resource.id of an alredy existing doc', done => {

        const docToCreate1: Document = Static.doc('sd1');
        docToCreate1.resource.id = 'a1';
        const docToCreate2: Document = Static.doc('sd1');
        docToCreate2.resource.id = 'a1';

        expectErr(()=>{return datastore.create(docToCreate1, 'u')
                .then(() => datastore.create(docToCreate2, 'u'))
            }, [DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS],done);
    });


    xit('should not create if created not present', async done => { // TODO decide how to adjust it

        const doc = Static.doc('sd1');
        delete doc.created;

        try {
            await datastore.create(doc, 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toBe(DatastoreErrors.INVALID_DOCUMENT);
        }
        done();
    });

    // update

    it('should update an existing document with no identifier conflict', async done => {

        const doc2 = Static.doc('id2');

        await datastore.create(Static.doc('id1'), 'u');
        await datastore.create(doc2, 'u');
        try {
            await datastore.update(doc2, 'u');
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('should not update if resource id not present', async done => {

        try {
            await datastore.update(Static.doc('sd1'), 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toBe(DatastoreErrors.DOCUMENT_NO_RESOURCE_ID);
        }
        done();
    });


    it('should not update if created not present', async done => {

        const doc = Static.doc('sd1');
        doc.resource.id = "1";
        delete doc.created;

        try {
            await datastore.update(doc, 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toBe(DatastoreErrors.INVALID_DOCUMENT);
        }
        done();
    });


    it('should not update if not existent', async done => {

        pouchdbProxy.get.and.returnValue(Promise.reject(undefined));

        try {
            await datastore.update(Static.doc('sd1', 'identifier1', 'Find', 'id1'), 'u');
            fail();
        } catch (expectedErr) {
            expect(expectedErr[0]).toBe(DatastoreErrors.DOCUMENT_NOT_FOUND);
        }
        done();
    });


    // fetch


    it('should get if existent', async done => {

        try {
            const result = await datastore.fetch('id5');
            expect(result.resource.id).toBe('id5');
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('should reject with keyOfM in when trying to get a non existing document', done => {

        pouchdbProxy.get.and.returnValue(Promise.reject(undefined));

        expectErr(async () => {
                await datastore.fetch('nonexisting');
            }, [DatastoreErrors.DOCUMENT_NOT_FOUND], done);
    });


    // remove

    it('should remove if existent', async (done) => {

        await datastore.remove(Static.doc('sd1', 'identifier1', 'Find', 'id1'));
        expect(pouchdbProxy.remove).toHaveBeenCalled();
        done();
    });


    it('should throw when no resource id', done => {

        expectErr(() => { return datastore.remove(Static.doc('sd2')) },
            [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID], done);
    });


    it('should throw when trying to remove and not existent', done => {

        pouchdbProxy.get.and.returnValue(Promise.reject(undefined));

        const d = Static.doc('sd1');
        d['resource']['id'] = 'hoax';
        expectErr(() => { return datastore.remove(d)}, [DatastoreErrors.DOCUMENT_NOT_FOUND], done);

    });
});
