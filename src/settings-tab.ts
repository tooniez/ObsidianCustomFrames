import {App, DropdownComponent, PluginSettingTab, SettingGroup} from "obsidian";
import {defaultSettings, presets} from "./settings";
import CustomFramesPlugin from "./main";

// TODO when changing to the new declarative system, also make each frame's page a sub-page like the snippets/font in obsidian settings
export class CustomFramesSettingTab extends PluginSettingTab {

    plugin: CustomFramesPlugin;

    constructor(app: App, plugin: CustomFramesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        let mainGroup = new SettingGroup(this.containerEl);
        mainGroup.addSetting(s => void s.setName(createFragment(f => f.createSpan({
            text: "Please note that Obsidian has to be restarted or reloaded for most Custom Frames settings to take effect.",
            cls: "mod-warning"
        }))));

        mainGroup.addSetting(s => void s
            .setName("Frame padding")
            .setDesc("The padding that should be left around the inside of custom frame panes, in pixels.")
            .addText(t => {
                t.inputEl.type = "number";
                void t.setValue(String(this.plugin.settings.padding));
                void t.onChange(async v => {
                    this.plugin.settings.padding = v.length ? Number(v) : defaultSettings.padding;
                    await this.plugin.saveSettings();
                });
            }));

        for (let frame of this.plugin.settings.frames) {
            let frameGroup = new SettingGroup(this.containerEl).setHeading(frame.displayName || "Unnamed frame");
            frameGroup.addSetting(s => void s
                .setName("Display name")
                .setDesc("The display name that this frame should have.")
                .addText(t => {
                    void t.setValue(frame.displayName);
                    void t.onChange(async v => {
                        frame.displayName = v;
                        frameGroup.setHeading(frame.displayName || "Unnamed frame");
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Icon")
                .setDesc(createFragment(f => {
                    f.createSpan({ text: "The icon that this frame's pane should have. The names of any " });
                    f.createEl("a", { text: "Lucide icons", href: "https://lucide.dev/" });
                    f.createSpan({ text: " can be used." });
                }))
                .addText(t => {
                    void t.setValue(frame.icon);
                    void t.onChange(async v => {
                        frame.icon = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("URL")
                .setDesc("The URL that should be opened in this frame.")
                .addText(t => {
                    void t.setValue(frame.url);
                    void t.onChange(async v => {
                        frame.url = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Disable on mobile")
                .setDesc("Custom Frames is a lot more restricted on mobile devices and doesn't allow for the same types of content to be displayed. If a frame doesn't work as expected on mobile, it can be disabled.")
                .addToggle(t => {
                    void t.setValue(frame.hideOnMobile);
                    void t.onChange(async v => {
                        frame.hideOnMobile = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Add ribbon icon")
                .setDesc("Whether a button to open this frame should be added to the ribbon.")
                .addToggle(t => {
                    void t.setValue(frame.addRibbonIcon);
                    void t.onChange(async v => {
                        frame.addRibbonIcon = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Open in center")
                .setDesc("Whether this frame should be opened in the unpinned center editor rather than one of the panes on the side. This is useful for sites that don't work well in a narrow view, or sites that don't require a note to be open when viewed.")
                .addToggle(t => {
                    void t.setValue(frame.openInCenter);
                    void t.onChange(async v => {
                        frame.openInCenter = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Force iframe")
                .setDesc(createFragment(f => {
                    f.createSpan({ text: "Whether this frame should use iframes on desktop as opposed to Electron webviews." });
                    f.createEl("br");
                    f.createEl("em", { text: "Only enable this setting if the frame is causing issues or frequent crashes. This setting causes all desktop-only settings to be ignored." });
                }))
                .addToggle(t => {
                    void t.setValue(frame.forceIframe);
                    void t.onChange(async v => {
                        frame.forceIframe = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Page zoom")
                .setDesc("The zoom that this frame's page should be displayed with, as a percentage.")
                .addText(t => {
                    t.inputEl.type = "number";
                    void t.setValue(String(frame.zoomLevel * 100));
                    void t.onChange(async v => {
                        frame.zoomLevel = v.length ? Number(v) / 100 : 1;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Additional CSS")
                .setDesc(createFragment(f => {
                    f.createSpan({ text: "A snippet of additional CSS that should be applied to this frame." });
                    f.createEl("br");
                    f.createEl("em", { text: "Note that this is only applied on desktop." });
                }))
                .addTextArea(t => {
                    t.inputEl.rows = 5;
                    t.inputEl.cols = 50;
                    void t.setValue(frame.customCss);
                    void t.onChange(async v => {
                        frame.customCss = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s
                .setName("Additional JavaScript")
                .setDesc(createFragment(f => {
                    f.createSpan({ text: "A snippet of additional JavaScript that should be applied to this frame." });
                    f.createEl("br");
                    f.createEl("em", { text: "Note that this is only applied on desktop." });
                }))
                .addTextArea(t => {
                    t.inputEl.rows = 5;
                    t.inputEl.cols = 50;
                    void t.setValue(frame.customJs);
                    void t.onChange(async v => {
                        frame.customJs = v;
                        await this.plugin.saveSettings();
                    });
                }));
            frameGroup.addSetting(s => void s.addButton(b => void b
                .setButtonText("Remove frame")
                .onClick(async () => {
                    this.plugin.settings.frames.remove(frame);
                    await this.plugin.saveSettings();
                    this.display();
                })));
        }

        let newGroup = new SettingGroup(this.containerEl);
        newGroup.addSetting(s => void s.setName(createFragment(f => {
            f.createSpan({
                text: "Please be advised that, when adding a site as a custom frame, you potentially expose personal information you enter to other plugins you have installed. For more information, see the discussion on ",
                cls: "mod-warning"
            });
            f.createEl("a", {
                text: "GitHub",
                href: "https://github.com/Ellpeck/ObsidianCustomFrames/issues/54#issuecomment-1210879685",
                cls: "mod-warning"
            });
            f.createSpan({ text: ".", cls: "mod-warning" });
        })));
        let dropdown: DropdownComponent;
        newGroup.addSetting(s => void s
            .setName("Create a new frame, either from a preset shipped with the plugin, or a custom one that you can edit yourself. Each frame's pane can be opened using the \"Custom Frames: Open\" command.")
            .addDropdown(d => {
                void d.addOption("new", "Custom");
                for (let [key, value] of Object.entries(presets).sort((a, b) => a[1].displayName.localeCompare(b[1].displayName)))
                    void d.addOption(key, value.displayName);
                dropdown = d;
            })
            .addButton(b => void b
                .setButtonText("Add frame")
                .setClass("custom-frames-add")
                .onClick(async () => {
                    let option = dropdown.getValue();
                    if (option == "new") {
                        this.plugin.settings.frames.push({
                            url: "",
                            displayName: "New Frame",
                            icon: "",
                            hideOnMobile: true,
                            addRibbonIcon: false,
                            openInCenter: false,
                            zoomLevel: 1,
                            forceIframe: false,
                            customCss: "",
                            customJs: ""
                        });
                    } else {
                        this.plugin.settings.frames.push(presets[option]!);
                    }
                    await this.plugin.saveSettings();
                    this.display();
                })));

        this.containerEl.createEl("hr");
        this.containerEl.createEl("p", { text: "Need help using the plugin? Feel free to join the Discord server!" });
        this.containerEl.createEl("a", { href: "https://link.ellpeck.de/discordweb" }).createEl("img", {
            attr: { src: "https://ellpeck.de/res/discord-wide.png" },
            cls: "custom-frames-support"
        });
        this.containerEl.createEl("p", { text: "If you like this plugin and want to support its development, you can do so through my website by clicking this fancy image!" });
        this.containerEl.createEl("a", { href: "https://ellpeck.de/support" }).createEl("img", {
            attr: { src: "https://ellpeck.de/res/generalsupport-wide.png" },
            cls: "custom-frames-support"
        });
    }
}
