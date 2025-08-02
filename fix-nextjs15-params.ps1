# PowerShell script to fix Next.js 15 async params in all page.tsx files
# This script updates page components to handle the new async params requirement

Write-Host "🔧 Fixing Next.js 15 async params in all page.tsx files..." -ForegroundColor Green

# Find all page.tsx files in the src/app directory
$pageFiles = Get-ChildItem -Path "src\app" -Recurse -Filter "page.tsx" | Where-Object { 
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -like "*\[*\]*" # Only files in dynamic route directories
}

$fixedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($file in $pageFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow
        
        # Skip files that already use Promise<> in params type
        if ($content -match "params:\s*Promise<") {
            Write-Host "  ✓ Already fixed" -ForegroundColor Green
            $skippedCount++
            continue
        }
        
        # Skip client components (they don't need this fix)
        if ($content -match "'use client'") {
            Write-Host "  ⏭️  Skipping client component" -ForegroundColor Cyan
            $skippedCount++
            continue
        }
        
        # Pattern 1: Simple params destructuring in function signature
        # export default function ComponentName({ params }: { params: { id: string } })
        $pattern1 = "export default (async )?function ([a-zA-Z]+)\(\{\s*params\s*\}:\s*\{\s*params:\s*\{([^}]+)\}\s*\}\)"
        if ($content -match $pattern1) {
            $isAsync = $matches[1] -ne $null -and $matches[1].Trim() -eq "async"
            $functionName = $matches[2]
            $paramsType = $matches[3]
            
            if (-not $isAsync) {
                # Make function async and update params type
                $replacement = "export default async function $functionName({ params }: { params: Promise<{$paramsType}> })"
                $content = $content -replace $pattern1, $replacement
                $modified = $true
                Write-Host "  🔄 Made function async and updated params type" -ForegroundColor Blue
            } else {
                # Just update params type
                $replacement = "export default async function $functionName({ params }: { params: Promise<{$paramsType}> })"
                $content = $content -replace $pattern1, $replacement
                $modified = $true
                Write-Host "  🔄 Updated params type to Promise" -ForegroundColor Blue
            }
        }
        
        # Pattern 2: Direct params access that needs await
        # const { id } = params; or const id = params.id;
        $directAccessPatterns = @(
            "const\s*\{\s*([^}]+)\}\s*=\s*params;",
            "const\s+([a-zA-Z]+)\s*=\s*params\.([a-zA-Z]+);"
        )
        
        foreach ($pattern in $directAccessPatterns) {
            if ($content -match $pattern) {
                # Replace with await params
                $content = $content -replace "=\s*params;", "= await params;"
                $content = $content -replace "=\s*params\.([a-zA-Z]+);", "= (await params).$1;"
                $modified = $true
                Write-Host "  🔄 Added await to params access" -ForegroundColor Blue
            }
        }
        
        # Pattern 3: Params used in redirect or other functions
        # redirect(`/path/${params.id}`)
        if ($content -match "params\.([a-zA-Z]+)" -and -not ($content -match "await params")) {
            # Find all params.property usage and wrap with await
            $content = $content -replace "params\.([a-zA-Z]+)", "(await params).$1"
            $modified = $true
            Write-Host "  🔄 Wrapped params access with await" -ForegroundColor Blue
        }
        
        # Save the file if modified
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "  ✅ Fixed successfully" -ForegroundColor Green
            $fixedCount++
        } else {
            Write-Host "  ⏭️  No changes needed" -ForegroundColor Cyan
            $skippedCount++
        }
        
    } catch {
        Write-Host "  ❌ Error processing file: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Green
Write-Host "  Fixed: $fixedCount files" -ForegroundColor Green
Write-Host "  Skipped: $skippedCount files" -ForegroundColor Cyan
Write-Host "  Errors: $errorCount files" -ForegroundColor Red

if ($fixedCount -gt 0) {
    Write-Host "`n🎉 Next.js 15 params fix completed! You can now run the build again." -ForegroundColor Green
} else {
    Write-Host "`n✨ All files were already compatible with Next.js 15!" -ForegroundColor Green
}
