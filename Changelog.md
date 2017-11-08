# Changelog #

#### Version 4.2.10 (lastest): ####
  * Add electrolysis compatibility
  * Update sv-SE translation (thanks to hiroshi)
  * Update compatibility to Firefox 37
  * Fix menu showing on panel ALT key binding

#### Version 4.2.9: ####
  * Add page loading on list item selection for mouse only control mode (thanks to Sam Bo)
  * Add loading URI location according modifier (control for new tab, shift for new window, thanks to atomizer)

#### Version 4.2.8: ####
  * Fix path initialization on about: pages

#### Version 4.2.7: ####
  * Fix url panel 1px width on Firefox 29

#### Version 4.2.6: ####
  * Fix use of nsIPrefBranch2 which becomes deprecated on Gecko 13
  * Update es locale (thanks to RigoNet)
  * Add Firefox 15 nightly compatibility

#### Version 4.2.5: ####
  * Stop event propagation on mouse whell in url bar to increase addon compatibility (thanks to Peter Leugner, Xclear addon author)
  * Add Firefox 13.0a1 support
  * Update hebrew locale (thanks to barryoni)
  * Update dutch locale (thanks to markh)
  * Update turkish locale (thanks to alfapegasi)

#### Version 4.2.4: ####
  * Add preference to invert scroll axis (thanks to CitizenhanceR)
  * Add Firefox 12.0a1 support

#### Version 4.2.3: ####
  * Add turkish translation

#### Version 4.2.2: ####
  * Fix hebrew translation
  * Fix url panel size on first display
  * Fix url loading while url is baddly formed
  * Update Firefox 7a1 compatibility (thanks to KAAMOS2)

#### Version 4.2.1: ####
  * Add hebrew translation

#### Version 4.2.0: ####
  * Add url bar icon
  * Display First run experience wiki page on first start up
  * Display Changelog wiki page on update
  * Add Firefox 4.0.`*` support
  * Update Manifest (install.rdf) fix for compatibility and adding translators

#### Version 4.1.5: ####
  * Fix a bug which skip some URL (thanks to HFT.Man)
  * Now compatible Firefox 4b9pre

#### Version 4.1.4: ####
  * Fix url highlighting
  * Fix middle-click for Linux / X server users (thanks to Ente.final)

#### Version 4.1.3: ####
  * Fix a bug: right button toolbar no more disappear

#### Version 4.1.2: ####
  * Add deutch description
  * Update Firefox 4.0 beta 8 pre compatibility

#### Version 4.1.1: ####
  * Fix url computation for FTP protocol: the add-on should now be compatible with all protocols.

#### Version 4.1.0: ####
  * Add new feature: url rows of panel could be now clicked:
    * clic will change the current url in urlbar
    * double clic will load the url to the current tab
  * Add german, italian, serbe and bresilian locales
  * Place the cursor at the end of url when it's modified
  * Add firefox 4.0b4pre support
  * Fix url computation bug with IPv4

#### Version 4.0.0: ####
  * Add keyboard control:
    * Pressing "alt" key when urlbar is focused opens a panel of urls
    * Pressing "enter" key goes to the selected url. You can still edit your current url.
  * Add preferences
  * Package javascript source
  * Add internationalization (other translations comming soon)

#### Version 3.0.0: ####
  * Add new feature: can go back deeper in urls after changing page (user request)
  * Add new feature : multilanguage support (en and fr traductions for the moment)
  * Improve url management: working independently for each tab (each tabs remember his own urls)
  * Update Firefox 3.5.x compatibility
  * Add validation of URI format
  * Add preferences
  * Review of original code