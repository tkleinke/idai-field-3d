import {browser, protractor, element, by} from 'protractor';

'use strict';

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');


/**
 * @author Thomas Kleinke
 */
export class SettingsPage {

    public static get = function() {
        return browser.get('#/settings');
    };

    public static clickSaveSettingsButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('save-settings-button'))), delays.ECWaitTime);
        element(by.id('save-settings-button')).click();
    };

    public static getRemoteSiteAddressInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('sync-target-address-input'))),
            delays.ECWaitTime);
        return element(by.id('sync-target-address-input'));
    };

    public static getRemoteSiteAddress = function() {
        return this.getRemoteSiteAddressInput().getAttribute('value');
    };

    public static getUserNameInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('username-input'))), delays.ECWaitTime);
        return element(by.id('username-input'));
    };
}