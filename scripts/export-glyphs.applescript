-- Run with:
--   osascript scripts/export-glyphs.applescript
--
-- Requires Accessibility permission for the host running osascript
-- so System Events can drive Glyphs 3.

property glyphsAppName : "Glyphs 3"
property glyphsProcessName : "Glyphs 3"
property projectRoot : "/Users/cho/Developer/sunghyun-sans"

set sourcePaths to {¬
    "/Users/cho/Developer/sunghyun-sans/sources/SunghyunSans.glyphspackage", ¬
    "/Users/cho/Developer/sunghyun-sans/sources/SunghyunSansDisambiguated.glyphspackage", ¬
    "/Users/cho/Developer/sunghyun-sans/sources/SunghyunSansJP.glyphspackage", ¬
    "/Users/cho/Developer/sunghyun-sans/sources/SunghyunSansKRHanja.glyphspackage", ¬
    "/Users/cho/Developer/sunghyun-sans/sources/SunghyunSansKR.glyphspackage"}

on documentForPath(targetPath)
    tell application glyphsAppName
        repeat with d in documents
            try
                if POSIX path of ((file of d) as alias) is targetPath then return d
            end try
        end repeat
    end tell
    return missing value
end documentForPath

on waitForDocument(targetPath)
    repeat 120 times
        set docRef to my documentForPath(targetPath)
        if docRef is not missing value then return docRef
        delay 0.5
    end repeat
    error "Could not find opened document: " & targetPath
end waitForDocument

on outputPrefixForSourcePath(sourcePath)
    return do shell script "basename -s .glyphspackage " & quoted form of sourcePath
end outputPrefixForSourcePath

on exportedFileCount(outputPrefix, extensionName)
    set shellCommand to "find " & quoted form of projectRoot & " -maxdepth 1 -name " & quoted form of (outputPrefix & "-*." & extensionName) & " | wc -l | tr -d ' '"
    return (do shell script shellCommand) as integer
end exportedFileCount

on hasCompletedPostScriptExport(outputPrefix)
    return (my exportedFileCount(outputPrefix, "otf") is 9) and ¬
        (my exportedFileCount(outputPrefix, "woff") is 9) and ¬
        (my exportedFileCount(outputPrefix, "woff2") is 9)
end hasCompletedPostScriptExport

on hasCompletedTrueTypeExport(outputPrefix)
    return my exportedFileCount(outputPrefix, "ttf") is 9
end hasCompletedTrueTypeExport

on waitForExportSheet()
    repeat 120 times
        if my totalSheetCount() > 0 then return
        delay 0.25
    end repeat
    error "Export sheet did not appear."
end waitForExportSheet

on waitForExportMenuEnabled()
    repeat 120 times
        tell application glyphsAppName to activate
        tell application "System Events"
            tell process glyphsProcessName
                try
                    set frontmost to true
                    if frontmost and (enabled of menu item "Export…" of menu 1 of menu bar item "File" of menu bar 1) then return
                end try
            end tell
        end tell
        delay 0.25
    end repeat
    error "Glyphs Export menu did not become available."
end waitForExportMenuEnabled

on totalSheetCount()
    tell application "System Events"
        tell process glyphsProcessName
            set sheetCount to 0
            repeat with w in windows
                try
                    set sheetCount to sheetCount + (count of sheets of w)
                end try
            end repeat
            return sheetCount
        end tell
    end tell
end totalSheetCount

on exportProgressSheetIsVisible()
    tell application "System Events"
        tell process glyphsProcessName
            repeat with w in windows
                try
                    repeat with s in sheets of w
                        try
                            if exists static text "Exporting Fonts" of s then return true
                        end try
                    end repeat
                end try
            end repeat
        end tell
    end tell
    return false
end exportProgressSheetIsVisible

on waitForNoSheets()
    repeat 7200 times
        if my totalSheetCount() is 0 then return
        delay 0.5
    end repeat
    error "A Glyphs sheet did not close before timeout."
end waitForNoSheets

on waitForPhaseOnePane()
    tell application "System Events"
        tell process glyphsProcessName
            repeat 120 times
                try
                    set paneRef to group 1 of sheet 1 of front window
                    if (exists radio button "PostScript/CFF" of paneRef) and (exists radio button "TrueType" of paneRef) then return
                end try
                delay 0.25
            end repeat
        end tell
    end tell
    error "Export options pane did not appear."
end waitForPhaseOnePane

on waitForPrimaryFormatCheckbox(primaryFormatTitle)
    tell application "System Events"
        tell process glyphsProcessName
            repeat 120 times
                try
                    if exists checkbox primaryFormatTitle of group 1 of sheet 1 of front window then return
                end try
                delay 0.25
            end repeat
        end tell
    end tell
    error "Missing primary format checkbox: " & primaryFormatTitle
end waitForPrimaryFormatCheckbox

on waitForPhaseTwoPane()
    tell application "System Events"
        tell process glyphsProcessName
            repeat 120 times
                try
                    if exists button "Export Font" of splitter group 1 of sheet 1 of front window then return
                end try
                delay 0.25
            end repeat
        end tell
    end tell
    error "Export destination pane did not appear."
end waitForPhaseTwoPane

on waitForExportToFinish()
    set sawProgressSheet to false
    set consecutiveSheetlessChecks to 0

    repeat 7200 times
        set currentSheetCount to my totalSheetCount()

        if my exportProgressSheetIsVisible() then
            set sawProgressSheet to true
            set consecutiveSheetlessChecks to 0
        else if currentSheetCount is 0 then
            set consecutiveSheetlessChecks to consecutiveSheetlessChecks + 1
            if sawProgressSheet then
                if consecutiveSheetlessChecks >= 2 then return
            else
                if consecutiveSheetlessChecks >= 20 then return
            end if
        else
            set consecutiveSheetlessChecks to 0
        end if

        delay 0.25
    end repeat

    error "Export did not finish before timeout."
end waitForExportToFinish

on clickRadioButton(buttonTitle)
    tell application "System Events"
        tell process glyphsProcessName
            set containerRef to group 1 of sheet 1 of front window
            if not (exists radio button buttonTitle of containerRef) then error "Missing radio button: " & buttonTitle
            click radio button buttonTitle of containerRef
        end tell
    end tell
end clickRadioButton

on setCheckboxState(buttonTitle, desiredState)
    tell application "System Events"
        tell process glyphsProcessName
            set containerRef to group 1 of sheet 1 of front window
            if not (exists checkbox buttonTitle of containerRef) then error "Missing checkbox: " & buttonTitle
            set checkboxRef to checkbox buttonTitle of containerRef
            set isChecked to (value of checkboxRef as integer) is 1
            if isChecked is not desiredState then click checkboxRef
        end tell
    end tell
end setCheckboxState

on clickFirstExistingButton(buttonTitles)
    tell application "System Events"
        tell process glyphsProcessName
            repeat 120 times
                repeat with buttonTitle in buttonTitles
                    set resolvedTitle to contents of buttonTitle
                    try
                        if exists button resolvedTitle of sheet 1 of front window then
                            click button resolvedTitle of sheet 1 of front window
                            return
                        end if
                    end try
                    try
                        if exists button resolvedTitle of group 1 of sheet 1 of front window then
                            click button resolvedTitle of group 1 of sheet 1 of front window
                            return
                        end if
                    end try
                    try
                        if exists button resolvedTitle of splitter group 1 of sheet 1 of front window then
                            click button resolvedTitle of splitter group 1 of sheet 1 of front window
                            return
                        end if
                    end try
                end repeat
                delay 0.25
            end repeat
        end tell
    end tell
    error "Missing button: " & (buttonTitles as text)
end clickFirstExistingButton

on exportFrontDocument(fileFormatTitle, primaryFormatTitle, includeWOFF, includeWOFF2)
    my waitForNoSheets()
    my waitForExportMenuEnabled()

    tell application "System Events"
        tell process glyphsProcessName
            click menu item "Export…" of menu 1 of menu bar item "File" of menu bar 1
        end tell
    end tell

    my waitForExportSheet()
    my waitForPhaseOnePane()
    my clickRadioButton(fileFormatTitle)
    my waitForPrimaryFormatCheckbox(primaryFormatTitle)
    my setCheckboxState(primaryFormatTitle, true)
    my setCheckboxState(".woff", includeWOFF)
    my setCheckboxState(".woff2", includeWOFF2)
    my clickFirstExistingButton({"Next…", "Next..."})
    my waitForPhaseTwoPane()
    my clickFirstExistingButton({"Export Font"})
    my waitForExportToFinish()
end exportFrontDocument

on quitGlyphsIfRunning()
    if application glyphsAppName is running then
        tell application glyphsAppName to quit saving no
        repeat 120 times
            if not (application glyphsAppName is running) then return
            delay 0.25
        end repeat
        error "Glyphs did not quit before timeout."
    end if
end quitGlyphsIfRunning

tell application glyphsAppName
    activate
end tell

repeat with sourcePath in sourcePaths
    set sourceAlias to POSIX file (contents of sourcePath) as alias
    set normalizedSourcePath to POSIX path of sourceAlias
    set outputPrefix to my outputPrefixForSourcePath(normalizedSourcePath)

    if my hasCompletedPostScriptExport(outputPrefix) then
        log ("Skipping OTF/WOFF/WOFF2 for " & normalizedSourcePath)
    else
        tell application glyphsAppName
            open sourceAlias
        end tell
        set docRef to my waitForDocument(normalizedSourcePath)
        delay 1
        log ("Exporting OTF/WOFF/WOFF2 from " & normalizedSourcePath)
        my exportFrontDocument("PostScript/CFF", ".otf", true, true)
        tell application glyphsAppName
            close docRef saving no
        end tell
    end if

    if my hasCompletedTrueTypeExport(outputPrefix) then
        log ("Skipping TTF from " & normalizedSourcePath)
    else
        tell application glyphsAppName
            open sourceAlias
        end tell
        set docRef to my waitForDocument(normalizedSourcePath)
        delay 1
        log ("Exporting TTF from " & normalizedSourcePath)
        my exportFrontDocument("TrueType", ".ttf", false, false)
        tell application glyphsAppName
            close docRef saving no
        end tell
    end if
end repeat

my quitGlyphsIfRunning()
