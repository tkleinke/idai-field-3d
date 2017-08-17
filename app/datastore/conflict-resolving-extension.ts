import {Action, Document} from 'idai-components-2/core';
import {M} from '../m';
import {PouchdbDatastore} from './pouchdb-datastore';
import {Injectable} from '@angular/core';
import {ConflictResolver} from './conflict-resolver';
import {RevisionHelper} from './revision-helper';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ConflictResolvingExtension {

    public promise: Promise<any> = Promise.resolve();

    private inspectedRevisionsIds: string[] = [];
    private datastore: PouchdbDatastore;
    private conflictResolver: ConflictResolver;

    public setDatastore(datastore: PouchdbDatastore) {
        this.datastore = datastore;
    }

    public setConflictResolver(conflictResolver: ConflictResolver) {
        this.conflictResolver = conflictResolver;
    }

    public autoResolve(document: Document, userName: string): Promise<any> {
        if (!this.datastore) return Promise.reject("no datastore");
        if (!this.conflictResolver) return Promise.reject("no conflict resolver");

        this.promise = this.promise.then(() => {
            if (ConflictResolvingExtension.hasUnhandledConflicts(
                this.inspectedRevisionsIds, document)) {

                return this.handleConflicts(document, userName);
            }
        });

        return this.promise;
    }

    public handleConflicts(document: Document, userName: string): Promise<any> {

        return this.getConflictedRevisions(document, userName).then(conflictedRevisions => {
            let promise: Promise<any> = Promise.resolve();

            for (let conflictedRevision of conflictedRevisions) {

                promise = promise.then(() => {
                    this.inspectedRevisionsIds.push(conflictedRevision['_rev']);

                    return this.datastore.fetchRevsInfo(conflictedRevision.resource.id)

                        .then(history => {
                            return this.datastore.fetchRevision(conflictedRevision.resource.id,
                                    RevisionHelper.getPreviousRevisionId(history, conflictedRevision))})
                        .then(previousRevision =>
                            this.solveAndUpdate(document, conflictedRevision, previousRevision)
                        );
                });
            }

            return promise;
        });
    }

    private solveAndUpdate(document, conflictedRevision, previousRevision) {

        const result = this.conflictResolver.tryToSolveConflict(
            document, conflictedRevision, previousRevision);

        if (result['resolvedConflicts'] > 0 || result['unresolvedConflicts'] == 0) {

            return this.datastore.update(document).then(() => {
                if (!result['unresolvedConflicts']) {
                    return this.datastore.removeRevision(document.resource.id, conflictedRevision['_rev']);
                }
            });
        }
    }

    private getConflictedRevisions(document: Document, userName: string): Promise<Array<Document>> {

        // TODO Necessary?
        if (!document['_conflicts']) return Promise.resolve([]);

        let promises: Array<Promise<Document>> = [];

        for (let revisionId of document['_conflicts']) {
            promises.push(this.datastore.fetchRevision(document.resource.id, revisionId));
        }

        return Promise.all(promises)
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND])) // TODO return a datastore error and adjust apidoc
            .then(revisions => ConflictResolvingExtension.extractRevisionsToHandle(revisions, userName));
    }

    /**
     * @param revisions
     * @param userName
     * @returns {Array<Document>} the conflicted revisions to
     *   actually to be resolved within this client. These are the ones having the
     *   clients current userName as the name of the lastAction of the revision.
     *   TODO unit test that if this is not the case the revision gets not handled
     */
    private static extractRevisionsToHandle(revisions, userName) {

        const result: Array<Document> = [];

        for (let revision of revisions) {
            const lastAction: Action = revision.modified && revision.modified.length > 0 ?
                revision.modified[revision.modified.length - 1] : revision.created;
            if (lastAction.user == userName) result.push(revision);
        }

        return result;
    }

    private static hasUnhandledConflicts(inspectedRevisionsIds, document: Document): boolean {

        if (!document['_conflicts']) return false;

        for (let revisionId of document['_conflicts']) {
            if (inspectedRevisionsIds.indexOf(revisionId) == -1) return true;
        }

        return false;
    }
}