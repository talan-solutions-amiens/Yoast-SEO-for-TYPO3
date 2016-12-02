<?php
namespace YoastSeoForTypo3\YoastSeo\ViewHelpers;

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

use TYPO3\CMS\Core;
use TYPO3\CMS\Fluid;
use TYPO3\CMS\Frontend;

/**
 * Class CanonicalLinkViewHelper
 *
 * Generate aa <link /> tag to the specified URL or the current page
 *
 * @package YoastSeoForTypo3\YoastSeo\ViewHelpers
 */
class CanonicalLinkViewHelper extends Fluid\Core\ViewHelper\AbstractTagBasedViewHelper
{

    /**
     * Name of the tag to be created by this view helper
     *
     * @var string
     */
    protected $tagName = 'link';

    /**
     * When creating a link to the current page take the "show content from this page"
     * directive into account.
     *
     * @param string $href The canonical URL set in the page properties
     * 
     * @return string
     */
    public function render($href = null)
    {
        $this->tag->addAttribute('rel', 'canonical');

        if (!empty($href) && Core\Utility\GeneralUtility::isValidUrl($href)) {
            $this->tag->addAttribute('href', $href);
        } elseif ($GLOBALS['TSFE'] instanceof Frontend\Controller\TypoScriptFrontendController
            && $GLOBALS['TSFE']->contentPid > 0
        ) {
            $uriBuilder = $this->controllerContext->getUriBuilder();

            $uri = $uriBuilder->reset()
                ->setCreateAbsoluteUri(true)
                ->setTargetPageUid($GLOBALS['TSFE']->contentPid)
                ->build();

            $this->tag->addAttribute('href', $uri);
        }

        return $this->tag->hasAttribute('href') ? $this->tag->render() : '';
    }

}