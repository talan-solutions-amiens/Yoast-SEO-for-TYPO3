/*global define, top, tx_yoast_seo, TYPO3*/

define(['jquery', './bundle', 'TYPO3/CMS/Backend/AjaxDataHandler', 'TYPO3/CMS/Backend/Notification', 'TYPO3/CMS/Backend/PageActions'], function ($, YoastSEO, AjaxDataHandler, Notification, PageActions) {
    'use strict';

    var previewRequest = $.get(tx_yoast_seo.previewUrl);

    $(function () {
        var $targetElement = $('#' + tx_yoast_seo.previewTargetId);
        var $formEngineTitle = $("*[data-formengine-input-name='" + $titleTcaSelector + "']");
        var $formEngineDescription = $("*[data-formengine-input-name='" + $descriptionTcaSelector + "']");

        if ($formEngineTitle.parents('.form-wizards-element').length) {
            $formEngineTitle.parents('.form-wizards-element').append("<div class='yoast-progressbars-container'><progress id='yoast-progress-title' class='yoast-progressbars'></progress></div>");
        } else {
            $formEngineTitle.parents('.form-control-wrap').append("<div class='yoast-progressbars-container'><progress id='yoast-progress-title' class='yoast-progressbars'></progress></div>");
        }

        $formEngineDescription.after("<div class='yoast-progressbars-container'><progress id='yoast-progress-description' class='yoast-progressbars'></progress></div>");

        previewRequest.done(function (previewDocument) {
            var $snippetPreviewElement = $targetElement.append('<div class="snippetPreview yoastPanel" />').find('.snippetPreview');

            // the preview is an XML document, for easy traversal convert it to a jQuery object
            var $previewDocument = $(previewDocument);
            var $metaSection = $previewDocument.find('meta');
            var $contentElements = $previewDocument.find('content>element');

            var pageContent = '';
            $contentElements.each(function (index, element) {
                pageContent += element.textContent;
            });

            var slug = $metaSection.find('slug').text().replace(/^\/|\/$/g, '');

            var snippetPreview = new YoastSEO.SnippetPreview({
                data: {
                    title: $metaSection.find('title').text(),
                    metaDesc: $metaSection.find('description').text(),
                    urlPath: slug
                },
                baseURL: $metaSection.find('url').text().replace($metaSection.find('slug').text(), '/'),
                placeholder: {
                    title: $metaSection.find('pageTitle').text(),
                    urlPath: slug
                },
                targetElement: $snippetPreviewElement.get(0),
                previewMode: 'desktop'
            });

            $formEngineTitle.attr('placeholder', $metaSection.find('pageTitle').text());

            var apps = [];
            var cnt = 0;
            var firstFocusKeyword = '';


            function initApps() {
                $($('.yoastSeo-analysis-focuskeyword').get().reverse()).each(function () {
                    var focusKeywordElement = $(this).closest('.row').find('input.form-control');
                    var focusKeyword = focusKeywordElement.val();

                    focusKeywordElement.attr('data-yoast-keyword', 'true');
                    focusKeywordElement.attr('data-yoast-app-iterator', cnt);

                    firstFocusKeyword = focusKeyword;

                    apps[cnt] = new YoastSEO.App({
                        snippetPreview: snippetPreview,
                        targets: {
                            output: $(this).attr('id'),
                            contentOutput: 'yoastseo-analysis-readability'
                        },
                        callbacks: {
                            getData: function () {
                                return {
                                    title: $metaSection.find('title').text(),
                                    text: pageContent,
                                    keyword: focusKeywordElement.val()
                                };
                            },
                            saveScores: function (score) {
                                var scoreClass = YoastSEO.scoreToRating(score / 10);
                                var scoreTextual = tx_yoast_scores[scoreClass.toLowerCase()];

                                $('*[name="' + $scoreSeoFieldSelector + '"]').val(scoreClass);

                                $('#yoastSeo-score-headline-focuskeyword').removeClass('good ok bad').addClass(scoreClass);

                                var tmpIconElement = focusKeywordElement.closest('.panel').find('.wpseo-score-icon').first();
                                tmpIconElement.removeClass('good ok bad');
                                tmpIconElement.addClass(scoreClass);

                                var $yoastScoreBarFocusKeyword = $('#yoastSeo-score-bar-focuskeyword');
                                $yoastScoreBarFocusKeyword.find('.wpseo-score-icon').first().removeClass('good ok bad').addClass(scoreClass);
                                $yoastScoreBarFocusKeyword.find('.wpseo-score-textual').first().html(scoreTextual);
                            },
                            saveContentScore: function (score) {
                                var scoreClass = YoastSEO.scoreToRating(score / 10);
                                var scoreTextual = tx_yoast_scores[scoreClass.toLowerCase()];

                                $('*[name="' + $scoreReadabilityFieldSelector + '"]').val(scoreClass);

                                $('#yoastSeo-score-headline-readability').removeClass('good ok bad').addClass(scoreClass);
                                var $yoastSeoScoreBarReadability = $('#yoastSeo-score-bar-readability');
                                $yoastSeoScoreBarReadability.find('.wpseo-score-icon').first().removeClass('good ok bad').addClass(scoreClass);
                                $yoastSeoScoreBarReadability.find('.wpseo-score-textual').first().html(scoreTextual);
                            }
                        },
                        locale: $metaSection.find('locale').text(),
                        translations: (window.tx_yoast_seo !== undefined && window.tx_yoast_seo !== null && window.tx_yoast_seo.translations !== undefined ? window.tx_yoast_seo.translations : null)
                    });

                    if (typeof $cornerstoneFieldSelector !== 'undefined' && $cornerstoneFieldSelector !== '') {
                        var cornerstoneField = $('*[name="' + $cornerstoneFieldSelector + '"]');
                        if (cornerstoneField.val() == 1) {
                            apps[cnt].switchAssessors(true);
                        }
                    }
                    cnt++;
                });

                if (apps.length === 0) {
                    apps[0] = new YoastSEO.App({
                        snippetPreview: snippetPreview,
                        targets: {
                            contentOutput: 'yoastseo-analysis-readability'
                        },
                        callbacks: {
                            getData: function () {
                                return {
                                    title: $metaSection.find('title').text(),
                                    text: pageContent,
                                    keyword: tx_yoast_seo.firstFocusKeyword
                                };
                            },
                            saveScores: function (score) {
                                var scoreClass = YoastSEO.scoreToRating(score / 10);
                                var scoreTextual = tx_yoast_scores[scoreClass.toLowerCase()];

                                $('*[name="' + $scoreSeoFieldSelector + '"]').val(scoreClass);

                                var $yoastScoreBarFocusKeyword = $('#yoastSeo-score-bar-focuskeyword');

                                $yoastScoreBarFocusKeyword.find('.wpseo-score-icon').first().removeClass('good ok bad').addClass(scoreClass);
                                $yoastScoreBarFocusKeyword.find('.wpseo-score-textual').first().html(scoreTextual);
                            },
                            saveContentScore: function (score) {
                                var scoreClass = YoastSEO.scoreToRating(score / 10);
                                var scoreTextual = tx_yoast_scores[scoreClass.toLowerCase()];

                                $('*[name="' + $scoreReadabilityFieldSelector + '"]').val(scoreClass);

                                $('#yoastSeo-score-headline-readability').removeClass('good ok bad').addClass(scoreClass);
                                var $yoastSeoScoreBarReadability = $('#yoastSeo-score-bar-readability');
                                $yoastSeoScoreBarReadability.find('.wpseo-score-icon').first().removeClass('good ok bad').addClass(scoreClass);
                                $yoastSeoScoreBarReadability.find('.wpseo-score-textual').first().html(scoreTextual);
                            }
                        },
                        locale: $metaSection.find('locale').text(),
                        translations: (window.tx_yoast_seo !== undefined && window.tx_yoast_seo !== null && window.tx_yoast_seo.translations !== undefined ? window.tx_yoast_seo.translations : null)
                    });

                    if (typeof $cornerstoneFieldSelector !== 'undefined' && $cornerstoneFieldSelector !== '') {
                        var cornerstoneField = $('*[name="' + $cornerstoneFieldSelector + '"]');
                        if (cornerstoneField.val() == 1) {
                            apps[0].switchAssessors(true);
                        }
                    }
                }
            }

            initApps();

            $('*[data-yoast-trigger="true"]').trigger('dataReceived', [pageContent, $metaSection.find('locale').text()]);

            var $focusKeywordPremiumPanel = $('div[id*="tx_yoastseo_focuskeyword_premium"]').find('.panel');

            $focusKeywordPremiumPanel.on('click', function () {
                setTimeout(function() {
                    initApps();
                }, 500);
            });

            $focusKeywordPremiumPanel.each(function () {
                $(this).find('.icon-tcarecords-tx_yoast_seo_premium_focus_keywords-default .icon-markup').addClass('wpseo-score-icon').removeClass('icon-markup').html('');
            });

            $('input[data-yoast-keyword="true"].form-control').on('input', function() {
                updateApp(apps[$(this).attr('data-yoast-app-iterator')], snippetPreview);
            });

            $('form[name="editform"]').find('h1').after('<div class="yoastSeo-score-bar"><div class="yoastSeo-score-bar--item" id="yoastSeo-score-bar-readability"><span class="wpseo-score-icon"></span> ' + (apps[0].i18n.dgettext('js-text-analysis', 'Readability')) + ': <span class="wpseo-score-textual">-</span></div><div class="yoastSeo-score-bar--item" id="yoastSeo-score-bar-focuskeyword"><span class="wpseo-score-icon"></span> ' + (apps[0].i18n.dgettext('js-text-analysis', 'SEO')) + ': <span class="wpseo-score-textual">-</span></div></div>');

            $('#yoastseo-analysis-focuskeyword').parents('.form-section').find('h4').prepend('<span class="wpseo-score-icon" id="yoastSeo-score-headline-focuskeyword"></span>');
            $('#yoastseo-analysis-readability').parents('.form-section').find('h4').prepend('<span class="wpseo-score-icon" id="yoastSeo-score-headline-readability"></span>');

            $formEngineTitle.on('input', function() {
                var $titleElement = $targetElement.find('#snippet-editor-title');
                var $newTitle = $metaSection.find('pageTitlePrepend').text() + $(this).val() + $metaSection.find('pageTitleAppend').text()
                $titleElement.val($newTitle.trim());

                snippetPreview.changedInput();

                setTimeout(function() {
                    updateAllApps(apps, snippetPreview);
                }, 500);
            });

            $formEngineDescription.on('input', function() {
                var $descriptionElement = $targetElement.find('#snippet-editor-meta-description');
                $descriptionElement.val($(this).val());
                snippetPreview.changedInput();

                setTimeout(function() {
                    updateAllApps(apps, snippetPreview);
                }, 500);
            });

            if (typeof $cornerstoneFieldSelector !== 'undefined' && $cornerstoneFieldSelector !== '') {
                $("*[data-formengine-input-name='" + $cornerstoneFieldSelector + "']").on('change', function () {
                    updateAllApps(apps, snippetPreview);
                });
            }

            $formEngineTitle.on('focus', updateProgressBars(snippetPreview));
            $formEngineDescription.on('focus', updateProgressBars(snippetPreview));

            $("a[role='tab']").on('click', function() {
                setTimeout(function() {
                    updateProgressBars(snippetPreview);
                }, 1000);
            });

            $('.snippet-editor__view-toggle').on('click', function() {
                updateProgressBars(snippetPreview);
            });

            updateProgressBars(snippetPreview);
        });

        function updateApp(app, snippetPreview) {
            if (typeof $cornerstoneFieldSelector !== 'undefined' && $cornerstoneFieldSelector !== '') {
                var cornerstoneField = $('*[name="' + $cornerstoneFieldSelector + '"]');
                if (cornerstoneField.val() == 1) {
                    app.switchAssessors(true);
                } else {
                    app.switchAssessors(false);
                }
            } else {
                app.switchAssessors(false);
            }

            app.getData();
            app.runAnalyzer();
            updateProgressBars(snippetPreview);
        }

        function updateAllApps(apps, snippetPreview) {
            for (var i=apps.length; i>0; i--) {
                updateApp(apps[(i - 1)], snippetPreview);
            }
        }

        function updateProgressBars(snippetPreview) {
            snippetPreview.changedInput();

            updateProgressBar('#yoast-progress-title', 'progress.snippet-editor__progress-title', 'snippet-editor__progress-title');
            updateProgressBar('#yoast-progress-description', 'progress.snippet-editor__progress-meta-description', 'snippet-editor__progress-meta-description');
        }

        function updateProgressBar(tcaProgressField, yoastProgressField, removeClass) {
            var $tcaProgressField = $(tcaProgressField);
            var $yoastProgressField = $(yoastProgressField);

            $tcaProgressField.attr('max', $yoastProgressField.attr('max'));
            $tcaProgressField.attr('class', $yoastProgressField.attr('class'));
            $tcaProgressField.removeClass(removeClass).addClass('yoast-progressbars');
            $tcaProgressField.val($yoastProgressField.val());
        }

        function switchToYoast() {
            var sPageURL = window.location.search.substring(1);
            var sURLVariables = sPageURL.split('&');
            for (var i = 0; i < sURLVariables.length; i++)
            {
                var sParameterName = sURLVariables[i].split('=');
                if (sParameterName[0] == 'switchToYoast')
                {
                    var id = $targetElement.parents('.tab-pane').attr('id');
                    $('a[href="#' + id + '"]').tab('show');
                }
            }
        }

        switchToYoast();

        previewRequest.fail(function (jqXHR) {
            var text = 'We got an error ' + jqXHR.status + ' (' + jqXHR.statusText + ') when requesting <a href="' + tx_yoast_seo.previewUrl + '" target="_blank">' + tx_yoast_seo.previewUrl + '</a> to analyse your content. Please check your javascript console for more information.';

            $targetElement.find('.spinner').hide();
            $targetElement.html('<div class="callout callout-warning">' + text + '</div>');
        });
    });
});
