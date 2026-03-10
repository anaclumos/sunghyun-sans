#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Exporting TTF from Glyphs ==="
PROJECT_ROOT="$ROOT_DIR" osascript <<'APPLESCRIPT'
set projectRoot to system attribute "PROJECT_ROOT"
set glyphsAppName to "Glyphs 3"
set glyphsProcessName to "Glyphs 3"
set sourcePaths to {¬
    projectRoot & "/sources/SunghyunSans.glyphspackage", ¬
    projectRoot & "/sources/SunghyunSansDisambiguated.glyphspackage", ¬
    projectRoot & "/sources/SunghyunSansJP.glyphspackage", ¬
    projectRoot & "/sources/SunghyunSansKRHanja.glyphspackage", ¬
    projectRoot & "/sources/SunghyunSansKR.glyphspackage"}

on documentForPath(targetPath, glyphsAppName)
    with timeout of 7200 seconds
        tell application glyphsAppName
            repeat with d in documents
                try
                    if POSIX path of ((file of d) as alias) is targetPath then return d
                end try
            end repeat
        end tell
    end timeout
    return missing value
end documentForPath

on waitForDocument(targetPath, glyphsAppName)
    repeat 120 times
        set docRef to my documentForPath(targetPath, glyphsAppName)
        if docRef is not missing value then return docRef
        delay 0.5
    end repeat
    error "Could not find opened document: " & targetPath
end waitForDocument

on outputPrefixForSourcePath(sourcePath)
    return do shell script "basename -s .glyphspackage " & quoted form of sourcePath
end outputPrefixForSourcePath

on exportedFileCount(projectRoot, outputPrefix, extensionName)
    set shellCommand to "find " & quoted form of projectRoot & " -maxdepth 1 -name " & quoted form of (outputPrefix & "-*." & extensionName) & " | wc -l | tr -d ' '"
    return (do shell script shellCommand) as integer
end exportedFileCount

on hasCompletedTrueTypeExport(projectRoot, outputPrefix)
    return my exportedFileCount(projectRoot, outputPrefix, "ttf") is 9
end hasCompletedTrueTypeExport

on frontWindowSheetCount(glyphsProcessName)
    tell application "System Events"
        tell process glyphsProcessName
            try
                return count of sheets of front window
            end try
        end tell
    end tell
    return 0
end frontWindowSheetCount

on waitForFrontWindowExportSheet(glyphsProcessName)
    repeat 120 times
        if my frontWindowSheetCount(glyphsProcessName) > 0 then return
        delay 0.25
    end repeat
    error "Export sheet did not appear on front window."
end waitForFrontWindowExportSheet

on waitForExportMenuEnabled(glyphsAppName, glyphsProcessName)
    repeat 120 times
        with timeout of 30 seconds
            tell application glyphsAppName to activate
        end timeout
        tell application "System Events"
            tell process glyphsProcessName
                try
                    set frontmost to true
                    perform action "AXRaise" of window 1
                    if enabled of menu item "Export…" of menu 1 of menu bar item "File" of menu bar 1 then return
                end try
            end tell
        end tell
        delay 0.25
    end repeat
    error "Glyphs Export menu did not become available."
end waitForExportMenuEnabled

on totalSheetCount(glyphsProcessName)
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

on exportProgressSheetIsVisible(glyphsProcessName)
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

on waitForFrontWindowNoSheets(glyphsProcessName)
    repeat 7200 times
        if my frontWindowSheetCount(glyphsProcessName) is 0 then return
        delay 0.5
    end repeat
    error "Front window sheet did not close before timeout."
end waitForFrontWindowNoSheets

on waitForPhaseOnePane(glyphsProcessName)
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

on waitForPrimaryFormatCheckbox(primaryFormatTitle, glyphsProcessName)
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

on waitForPhaseTwoPane(glyphsProcessName)
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

on waitForAllExportsToFinish(glyphsProcessName)
    set sawProgressSheet to false
    set consecutiveSheetlessChecks to 0

    repeat 7200 times
        set currentSheetCount to my totalSheetCount(glyphsProcessName)

        if my exportProgressSheetIsVisible(glyphsProcessName) then
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

    error "Exports did not finish before timeout."
end waitForAllExportsToFinish

on clickRadioButton(buttonTitle, glyphsProcessName)
    tell application "System Events"
        tell process glyphsProcessName
            set containerRef to group 1 of sheet 1 of front window
            if not (exists radio button buttonTitle of containerRef) then error "Missing radio button: " & buttonTitle
            click radio button buttonTitle of containerRef
        end tell
    end tell
end clickRadioButton

on setCheckboxState(buttonTitle, desiredState, glyphsProcessName)
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

on clickFirstExistingButton(buttonTitles, glyphsProcessName)
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

on clickExportFontOnAllWindows(glyphsProcessName)
    tell application "System Events"
        tell process glyphsProcessName
            repeat with w in windows
                try
                    click button "Export Font" of splitter group 1 of sheet 1 of w
                end try
            end repeat
        end tell
    end tell
end clickExportFontOnAllWindows

on prepareExportOnFrontDocument(fileFormatTitle, primaryFormatTitle, includePrimary, includeWOFF, includeWOFF2, glyphsAppName, glyphsProcessName)
    my waitForFrontWindowNoSheets(glyphsProcessName)
    my waitForExportMenuEnabled(glyphsAppName, glyphsProcessName)

    tell application "System Events"
        tell process glyphsProcessName
            click menu item "Export…" of menu 1 of menu bar item "File" of menu bar 1
        end tell
    end tell

    my waitForFrontWindowExportSheet(glyphsProcessName)
    my waitForPhaseOnePane(glyphsProcessName)
    my clickRadioButton(fileFormatTitle, glyphsProcessName)
    my waitForPrimaryFormatCheckbox(primaryFormatTitle, glyphsProcessName)
    my setCheckboxState(primaryFormatTitle, includePrimary, glyphsProcessName)
    my setCheckboxState(".woff", includeWOFF, glyphsProcessName)
    my setCheckboxState(".woff2", includeWOFF2, glyphsProcessName)
    my clickFirstExistingButton({"Next…", "Next..."}, glyphsProcessName)
    my waitForPhaseTwoPane(glyphsProcessName)
    -- Stop here: "Export Font" button is ready but not clicked
end prepareExportOnFrontDocument

with timeout of 7200 seconds
    tell application glyphsAppName
        activate
    end tell
end timeout

-- Phase 1: Open all source files at once
log "Opening all source files..."
repeat with sourcePath in sourcePaths
    set sourceAlias to POSIX file (contents of sourcePath) as alias
    with timeout of 7200 seconds
        tell application glyphsAppName
            open sourceAlias
        end tell
    end timeout
end repeat

-- Phase 2: Wait for all documents to be loaded
set docInfos to {}
repeat with sourcePath in sourcePaths
    set sourceAlias to POSIX file (contents of sourcePath) as alias
    set normalizedSourcePath to POSIX path of sourceAlias
    set outputPrefix to my outputPrefixForSourcePath(normalizedSourcePath)
    set docRef to my waitForDocument(normalizedSourcePath, glyphsAppName)
    set end of docInfos to {sourceAlias, normalizedSourcePath, outputPrefix, docRef}
end repeat
log "All source files loaded."

-- Phase 3: Prepare TrueType export dialogs on all documents
log "Preparing TrueType exports..."
repeat with info in docInfos
    set sourceAlias to item 1 of info
    set normalizedSourcePath to item 2 of info
    set outputPrefix to item 3 of info

    if not my hasCompletedTrueTypeExport(projectRoot, outputPrefix) then
        with timeout of 7200 seconds
            tell application glyphsAppName
                open sourceAlias
            end tell
        end timeout
        tell application "System Events"
            tell process glyphsProcessName
                try
                    perform action "AXRaise" of window 1
                end try
            end tell
        end tell
        delay 0.5
        log ("Preparing TTF export for " & normalizedSourcePath)
        my prepareExportOnFrontDocument("TrueType", ".ttf", true, false, false, glyphsAppName, glyphsProcessName)
    else
        log ("Skipping TTF for " & normalizedSourcePath)
    end if
end repeat

-- Click "Export Font" on all prepared windows at once
log "Clicking Export Font on all TrueType windows..."
my clickExportFontOnAllWindows(glyphsProcessName)

my waitForAllExportsToFinish(glyphsProcessName)
log "TrueType exports complete."

-- Phase 4: Close all documents
repeat with info in docInfos
    set docRef to item 4 of info
    with timeout of 7200 seconds
        tell application glyphsAppName
            close docRef saving no
        end tell
    end timeout
end repeat
APPLESCRIPT

echo "=== TTF export complete ==="
