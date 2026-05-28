"""
Add a custClrLst to theme1.xml so all 10 AIR palette colors (5 dominants + 5 accents)
plus anchor dark/light appear by name in PowerPoint's color picker under "Custom Colors".

Operates in place on R1C.pptx.
"""
import os, re, zipfile

PPTX = "/Users/lee.payne@weather.com/Dev/project-air-creative/assets/templates/AIDAY-PPT-Template-R1C.pptx"

CUSTOM_COLORS = [
    ("AIR Magenta",         "FB00FF"),
    ("AIR Magenta Accent",  "F4DC52"),
    ("AIR Cyan",            "0062FF"),
    ("AIR Cyan Accent",     "67FAE0"),
    ("AIR Violet",          "46125B"),
    ("AIR Violet Accent",   "F4DC52"),
    ("AIR Amber",           "FF9500"),
    ("AIR Amber Accent",    "BC1100"),
    ("AIR Forest",          "1F7A4D"),
    ("AIR Forest Accent",   "0D142A"),
    ("AIR Anchor Dark",     "292929"),
    ("AIR Anchor Light",    "F0F0EB"),
]

custclr_xml = "<a:custClrLst>" + "".join(
    f'<a:custClr name="{name}"><a:srgbClr val="{hex_val}"/></a:custClr>'
    for name, hex_val in CUSTOM_COLORS
) + "</a:custClrLst>"

with zipfile.ZipFile(PPTX) as z:
    theme_xml = z.read("ppt/theme/theme1.xml").decode("utf-8")

# Remove any existing custClrLst
theme_xml = re.sub(r"<a:custClrLst>.*?</a:custClrLst>", "", theme_xml, flags=re.DOTALL)

# Insert before </a:theme>. PowerPoint expects custClrLst after objectDefaults and before extLst,
# but right before </a:theme> works in practice and is the simplest insertion point.
if "</a:theme>" not in theme_xml:
    raise SystemExit("Could not find </a:theme> close tag")

theme_xml = theme_xml.replace("</a:theme>", custclr_xml + "</a:theme>")

# Write back
tmp = PPTX + ".tmp"
with zipfile.ZipFile(PPTX, "r") as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "ppt/theme/theme1.xml":
            data = theme_xml.encode("utf-8")
        zout.writestr(item, data)
os.replace(tmp, PPTX)
print(f"Patched custClrLst into {PPTX}")
print(f"Added {len(CUSTOM_COLORS)} named custom colors")
