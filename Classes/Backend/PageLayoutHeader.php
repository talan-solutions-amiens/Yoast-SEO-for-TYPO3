<?php
namespace YoastSeoForTypo3\YoastSeo\Backend;

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */

use TYPO3\CMS;

/**
 * Class PageLayoutHeader
 *
 * Add some bootstrapping markup to the page layout module
 *
 * @package YoastSeoForTypo3\YoastSeo\Backend
 */
class PageLayoutHeader
{

    /**
     * The field used to store the focus keyword which is used as a part of the content analysis
     *
     * @var string
     */
    const COLUMN_NAME = 'tx_yoastseo_focuskeyword';

    /**
     * The page type number used to fetch the preview XML using TSFE
     *
     * @var int
     */
    const FE_PREVIEW_TYPE = 1480321830;

    /**
     * Path were translations are stored, include the file using the locale
     * found depending on the settings of the current backend user
     *
     * @var string
     */
    const APP_TRANSLATION_FILE_PATTERN = 'EXT:yoast_seo/Resources/Private/Language/wordpress-seo-%s.json';

    /**
     * Format of configuration array from `ext_localconf.php`
     *
     * @var array
     */
    protected $configuration = array(
        'translations' => array(
            'availableLocales' => array(),
            'languageKeyToLocaleMapping' => array()
        )
    );

    /**
     * Used to find locale dependencies configured for the CMS interface
     *
     * @var CMS\Core\Localization\Locales
     */
    protected $localeService;

    /**
     * Page renderer object used to register JS modules, stylesheets etc.
     *
     * @var CMS\Core\Page\PageRenderer
     */
    protected $pageRenderer;

    /**
     * Initialize the page renderer, locale service and configuration
     */
    public function __construct()
    {
        if (array_key_exists('yoast_seo', $GLOBALS['TYPO3_CONF_VARS']['EXTCONF'])
            && is_array($GLOBALS['TYPO3_CONF_VARS']['EXTCONF']['yoast_seo'])
        ) {
            $this->configuration = $GLOBALS['TYPO3_CONF_VARS']['EXTCONF']['yoast_seo'];
        }

        $this->localeService = CMS\Core\Utility\GeneralUtility::makeInstance(CMS\Core\Localization\Locales::class);
        $this->pageRenderer = CMS\Core\Utility\GeneralUtility::makeInstance(CMS\Core\Page\PageRenderer::class);
    }

    /**
     * Render markup to bootstrap the JS module and register our own custom stylesheet
     *
     * @return string
     */
    public function render()
    {
        $lineBuffer = array();

        /** @var CMS\Backend\Controller\PageLayoutController $pageLayoutController */
        $pageLayoutController = $GLOBALS['SOBE'];

        $currentPage = NULL;
        $focusKeyword = '';
        $previewDataUrl = '';
        $recordId = 0;
        $tableName = 'pages';

        if ($pageLayoutController instanceof CMS\Backend\Controller\PageLayoutController
            && (int) $pageLayoutController->id > 0
            && (int) $pageLayoutController->current_sys_language === 0
        ) {
            $currentPage = CMS\Backend\Utility\BackendUtility::getRecord(
                'pages',
                (int) $pageLayoutController->id
            );
        } elseif ($pageLayoutController instanceof CMS\Backend\Controller\PageLayoutController
            && (int) $pageLayoutController->id > 0
            && (int) $pageLayoutController->current_sys_language > 0
        ) {
            $overlayRecords = CMS\Backend\Utility\BackendUtility::getRecordLocalization(
                'pages',
                (int) $pageLayoutController->id,
                (int) $pageLayoutController->current_sys_language
            );

            if (is_array($overlayRecords) && array_key_exists(0, $overlayRecords) && is_array($overlayRecords[0])) {
                $currentPage = $overlayRecords[0];

                $tableName = 'pages_language_overlay';
            }
        }

        if (is_array($currentPage) && array_key_exists(self::COLUMN_NAME, $currentPage)) {
            $focusKeyword = $currentPage[self::COLUMN_NAME];

            $recordId = $currentPage['uid'];

            $previewDataUrl = vsprintf(
                '/index.php?id=%d&type=%d&L=%d',
                array(
                    $pageLayoutController->id,
                    self::FE_PREVIEW_TYPE,
                    $pageLayoutController->current_sys_language
                )
            );
        }

        $interfaceLocale = $this->getInterfaceLocale();

        if ($interfaceLocale !== null
            && ($translationFilePath = sprintf(
                self::APP_TRANSLATION_FILE_PATTERN,
                $interfaceLocale
            )) !== false
            && ($translationFilePath = CMS\Core\Utility\GeneralUtility::getFileAbsFileName(
                $translationFilePath
            )) !== false
            && file_exists($translationFilePath)
        ) {
            $this->pageRenderer->addJsInlineCode(
                md5($translationFilePath),
                'var tx_yoast_seo = tx_yoast_seo || {};'
                    . ' tx_yoast_seo.translations = '
                    . file_get_contents($translationFilePath)
                    . ';'
            );
        }



        $this->pageRenderer->loadRequireJsModule('TYPO3/CMS/YoastSeo/bundle');

        $this->pageRenderer->addCssFile(
            CMS\Core\Utility\ExtensionManagementUtility::extRelPath('yoast_seo') . 'Resources/Public/CSS/yoast-seo.min.css'
        );

        $lineBuffer[] = '<div id="snippet" ' .
            'data-yoast-focuskeyword="' . htmlspecialchars($focusKeyword) . '"' .
            'data-yoast-previewdataurl="' . htmlspecialchars($previewDataUrl) . '"' .
            'data-yoast-recordtable="' . htmlspecialchars($tableName) . '"' .
            'data-yoast-recordid="' . htmlspecialchars($recordId) . '"' .
            '></div>';

        $lineBuffer[] = '<div class="yoastPanel">';
        $lineBuffer[] = '<h3 class="snippet-editor__heading" data-controls="readability">';
		$lineBuffer[] = '<span class="wpseo-score-icon"></span> Readability <span class="fa fa-chevron-down"></span>';
		$lineBuffer[] = '</h3>';
        $lineBuffer[] = '<div id="readability" class="yoastPanel__content"></div>';
        $lineBuffer[] = '</div>';

        $lineBuffer[] = '<div class="yoastPanel">';
		$lineBuffer[] = '<h3 class="snippet-editor__heading" data-controls="seo">';
        $lineBuffer[] = '<span class="wpseo-score-icon"></span> SEO <span class="fa fa-chevron-down"></span>';
		$lineBuffer[] = '</h3>';
        $lineBuffer[] = '<div id="seo" class="yoastPanel__content"></div>';
        $lineBuffer[] = '</div>';

        return implode(PHP_EOL, $lineBuffer);
    }

    /**
     * Try to resolve a supported locale based on the user settings
     * take the configured locale dependencies into account
     * so if the TYPO3 interface is tailored for a specific dialect
     * the local of a parent language might be used
     *
     * @return string|null
     */
    protected function getInterfaceLocale()
    {
        $locale = null;
        $languageChain = null;

        if ($GLOBALS['BE_USER'] instanceof CMS\Core\Authentication\BackendUserAuthentication
            && is_array($GLOBALS['BE_USER']->uc)
            && array_key_exists('lang', $GLOBALS['BE_USER']->uc)
            && !empty($GLOBALS['BE_USER']->uc['lang'])
        ) {
            $languageChain = $this->localeService->getLocaleDependencies(
                $GLOBALS['BE_USER']->uc['lang']
            );

            array_unshift($languageChain, $GLOBALS['BE_USER']->uc['lang']);
        }

        // try to find a matching locale available for this plugins UI
        // take configured locale dependencies into account
        if ($languageChain !== null
            && ($suitableLocales = array_intersect(
                $languageChain,
                $this->configuration['translations']['availableLocales']
            )) !== false
            && count($suitableLocales) > 0
        ) {
            $locale = array_shift($suitableLocales);
        }

        // if a locale couldn't be resolved try if an entry of the
        // language dependency chain matches legacy mapping
        if ($locale === null && $languageChain !== null
            && ($suitableLanguageKeys = array_intersect(
                $languageChain,
                array_flip(
                    $this->configuration['translations']['languageKeyToLocaleMapping']
                )
            )) !== false
            && count($suitableLanguageKeys) > 0
        ) {
            $locale = $this->configuration['translations']['languageKeyToLocaleMapping'][array_shift($suitableLanguageKeys)];
        }

        return $locale;
    }

}