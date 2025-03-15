import { nextTick, type App } from "vue"
import { createI18n, type I18n } from "vue-i18n"

type I18nConfiguration = {
    languages: string[],
    fallback: string
}

let i18nService: I18nService
let i18nConfiguraton: I18nConfiguration

export async function initializeI18n(config: I18nConfiguration) {
    const language = config.languages.includes(navigator.language) ? navigator.language: config.fallback
    const i18n = createI18n({ locale: language })
    i18nConfiguraton = config
    i18nService = new I18nService(i18n)
    await i18nService.setLanguage(language)
}

export class I18nService {

    constructor(public readonly i18n: I18n<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, string, true>) {}

    async setLanguage(language: string) {
        if (!i18nConfiguraton.languages.includes(language)) {
            language = i18nConfiguraton.fallback
        }
        if (this.i18n.mode === 'legacy') {
            this.i18n.global.locale = language
        } else {
            (this.i18n.global.locale as unknown as {value: string}).value = language
        }
        const messages = await import(`@/i18n/${language}.json`)
        this.i18n.global.setLocaleMessage(language, messages)
        return nextTick()
    }

}

export default {
    async install(app: App) {
        app.config.globalProperties.$i18nService = i18nService
        app.use(i18nService.i18n)
        app.provide('i18nService', i18nService)
    }
}
