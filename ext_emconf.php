<?php
$EM_CONF[$_EXTKEY] = array(
    'title' => 'Yoast SEO for TYPO3',
    'description' => 'Optimise your website for search engines with Yoast SEO for TYPO3. With this extension you get all the technical SEO stuff you need and will help editors to write high quality content.',
    'category' => 'misc',
    'author' => 'MaxServ / Yoast',
    'author_company' => 'MaxServ B.V., Yoast',
    'author_email' => '',
    'clearCacheOnLoad' => 0,
    'dependencies' => '',
    'state' => 'stable',
    'uploadfolder' => 0,
    'version' => '3.0.5',
    'constraints' => array(
        'depends' => array(
            'typo3' => '7.6.13-8.7.99'
        ),
        'conflicts' => array(),
        'suggests' => array(
            'realurl' => ''
        ),
    ),
    'autoload' => array(
        'psr-4' => array('YoastSeoForTypo3\\YoastSeo\\' => 'Classes')
    ),
    'conflicts' => '',
    'suggests' => array(),
);
