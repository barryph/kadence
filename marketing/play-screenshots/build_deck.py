# Writes app-store-screenshots.json: the Kadence Play Store deck.
#
# Element rects are computed from the canvas size and the device aspect ratio
# rather than hand-measured, so they stay correct at every required resolution.
#
# Usage: python3 build_deck.py
import json

CANVAS = {
    "android": (1080, 1920),
    "android-7": (1200, 1920),
    "android-10": (1600, 2560),
    "feature-graphic": (1024, 500),
}
PHONE_RATIO = 9 / 19.5
TABLET_RATIO = 5 / 8

# --- Slide copy -------------------------------------------------------------
# One idea per headline, 3-5 words, final line carries the accent colour.
SLIDES = [
    {
        "id": "s_kd_1",
        "layout": "two-devices",
        "label": "QUEUE WORKFLOW",
        "headline": "Training that fits\nreal life.",
        "screenshot": "01-home-queue-top.png",
        "screenshotSecondary": "02-home-queue-end.png",
    },
    {
        "id": "s_kd_2",
        "layout": "device-bottom",
        "label": "INTERVAL SCHEDULING",
        "headline": "Choose your\nown rhythm.",
        "screenshot": "03-interval-form.png",
    },
    {
        "id": "s_kd_3",
        "layout": "device-top",
        "label": "WEEKLY GOALS",
        "headline": "Set a weekly\ntarget.",
        "screenshot": "04-goals-list.png",
    },
    {
        "id": "s_kd_4",
        "layout": "device-bottom",
        "label": "ADHERENCE",
        "headline": "See what you\nactually do.",
        "screenshot": "05-goal-this-week.png",
    },
    {
        "id": "s_kd_5",
        "layout": "device-bottom",
        "label": "CADENCE",
        "headline": "Watch the\npattern build.",
        "screenshot": "06-goal-cadence.png",
    },
    {
        "id": "s_kd_6",
        "layout": "hero",
        "label": "INSIGHTS",
        "headline": "Your week,\none chart.",
        "screenshot": "07-insights.png",
    },
    {
        "id": "s_kd_7",
        "layout": "device-top",
        "label": "CALENDAR",
        "headline": "Every rep,\nlogged.",
        "screenshot": "08-timeline.png",
    },
    {
        "id": "s_kd_8",
        "layout": "no-device",
        "label": "BUILT FOR REAL LIFE",
        "headline": "Your week,\nyour rules.",
        "features": [
            "Interval scheduling",
            "Queue workflow",
            "Weekly goals",
            "Adherence rings",
            "Cadence heatmap",
        ],
    },
]

def caption_rect(cW, cH, align="center"):
    width = cW * 0.88
    return {
        "x": round((cW - width) / 2) if align == "center" else round(cW * 0.06),
        "y": round(cH * 0.045),
        "width": round(width),
        "height": round(cH * 0.30),
        "rotation": 0,
        "zIndex": 4,
    }


def device_rect(
    cH,
    ratio,
    width_fraction,
    top_fraction,
    cW,
    rotation=0,
    z=3,
    x_fraction=None,
):
    width = cW * width_fraction
    height = width / ratio
    x = (cW - width) / 2 if x_fraction is None else cW * x_fraction
    return {
        "x": round(x),
        "y": round(cH * top_fraction),
        "width": round(width),
        "height": round(height),
        "rotation": rotation,
        "zIndex": z,
    }


def transforms_for(layout, cW, cH, ratio):
    """Rects for a layout, tuned so the phone sits large but never clips."""
    caption = caption_rect(cW, cH)
    if layout == "hero":
        return {
            "caption": caption,
            # Slightly larger and higher than the other layouts: the hero is the
            # slide most people see as a thumbnail, so the phone carries more of
            # the canvas.
            "device": device_rect(cH, ratio, 0.76, 0.355, cW),
        }
    if layout == "device-bottom":
        return {
            "caption": caption,
            "device": device_rect(cH, ratio, 0.66, 0.365, cW),
        }
    if layout == "device-top":
        # Anchored to the top edge and sized so it clears the caption below it:
        # the caption sits outside the device, never on top of it.
        top = cH * 0.022
        caption_top = cH * 0.715
        max_width = (caption_top - top - cH * 0.02) * ratio
        width = min(cW * 0.66, max_width)
        return {
            "caption": {**caption, "y": round(caption_top)},
            "device": {
                "x": round((cW - width) / 2),
                "y": round(top),
                "width": round(width),
                "height": round(width / ratio),
                "rotation": 0,
                "zIndex": 3,
            },
        }
    if layout == "two-devices":
        caption = {**caption, "y": round(cH * 0.035)}
        # Back phone peeks in from the right and sits higher; the front phone is
        # lower-left. They overlap by a sliver of bezel, not of screen, so both
        # screenshots stay readable.
        return {
            "caption": caption,
            "deviceSecondary": device_rect(
                cH, ratio, 0.44, 0.225, cW, rotation=7, z=2, x_fraction=0.275
            ),
            "device": device_rect(cH, ratio, 0.60, 0.415, cW, z=3),
        }
    if layout == "no-device":
        return {
            "caption": {
                "x": round(cW * 0.07),
                "y": round(cH * 0.38),
                "width": round(cW * 0.86),
                "height": round(cH * 0.26),
                "rotation": 0,
                "zIndex": 4,
            }
        }
    return {}


def feature_list_elements(cW, cH):
    """The closing slide's feature wall: one muted line per capability."""
    return [
        {
            "id": "text:features",
            "text": {"en": "\n".join(f"\u00b7  {item}" for item in SLIDES[-1]["features"])},
            "transform": {
                "x": round(cW * 0.1),
                "y": round(cH * 0.70),
                "width": round(cW * 0.8),
                "height": round(cH * 0.2),
                "rotation": 0,
                "zIndex": 5,
            },
            "fontSize": round(cW * 0.046),
            "fontWeight": 600,
            "color": "#C8D4E8",
            "align": "center",
        }
    ]


def build(device, folder, ratio):
    cW, cH = CANVAS[device]
    slides = []
    for spec in SLIDES:
        slide = {
            "id": f"{spec['id']}_{device}",
            "layout": spec["layout"],
            "label": {"en": spec["label"]},
            "headline": {"en": spec["headline"]},
            "screenshot": "",
            "transforms": transforms_for(spec["layout"], cW, cH, ratio),
        }
        if spec.get("screenshot"):
            slide["screenshot"] = f"/screenshots/{folder}/en/{spec['screenshot']}"
        if spec.get("screenshotSecondary"):
            slide["screenshotSecondary"] = (
                f"/screenshots/{folder}/en/{spec['screenshotSecondary']}"
            )
        if spec.get("features"):
            slide["textElements"] = feature_list_elements(cW, cH)
        slides.append(slide)
    return slides


feature_graphic = [
    {
        "id": "s_kd_fg",
        "layout": "feature-graphic",
        "label": {"en": "FITNESS THAT ADAPTS"},
        "headline": {"en": "Training that fits real life.\nPick the days you\u2019re free."},
        "screenshot": "",
        "transforms": {},
    }
]

state = {
    "schemaVersion": 2,
    "appName": "Kadence",
    "themeId": "deep-space",
    "connectedCanvas": True,
    "locales": ["en"],
    "locale": "en",
    "device": "android",
    "orientation": "portrait",
    "appIcon": "/app-icon.png",
    "slidesByDevice": {
        "android": build("android", "android/phone", PHONE_RATIO),
        "android-7": build("android-7", "tablet-7", TABLET_RATIO),
        "android-10": build("android-10", "tablet-10", TABLET_RATIO),
        "feature-graphic": feature_graphic,
        # iOS decks are not part of this request; left empty so the platform
        # switch does not offer a half-built deck.
        "iphone": [],
        "ipad": [],
    },
}

with open("app-store-screenshots.json", "w") as handle:
    json.dump(state, handle, indent=2)
    handle.write("\n")

print("wrote app-store-screenshots.json")
for device, slides in state["slidesByDevice"].items():
    print(f"  {device}: {len(slides)} slides")
