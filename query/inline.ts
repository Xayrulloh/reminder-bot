import {InlineKeyboard} from 'grammy'
import Model from '#config/database'
import HLanguage from '#helper/language'
import {HReplace} from '#helper/replacer'
import {BotContext} from "#types/context";
import {InlineQueryResult, InputMessageContent} from "grammy/out/platform.node";
import crypto from 'crypto'
import fuzzy from 'fuzzy'
import path from 'path'
import fs from 'fs'

export async function inlineQuery(ctx: BotContext) {
    const inlineQueryMessage = ctx.inlineQuery?.query
    const tryAgain: string = HLanguage('uz', 'tryAgain')
    const inputMessageContent: InputMessageContent = {
        parse_mode: "HTML",
        message_text: ""
    }
    const responseObj: InlineQueryResult = {
        type: 'article',
        id: crypto.randomUUID(),
        title: "",
        reply_markup: new InlineKeyboard().switchInlineCurrent(tryAgain, ''),
        input_message_content: inputMessageContent
    }

    // if not inline query
    if (!inlineQueryMessage) {
        responseObj.title = HLanguage('uz', 'startSearch')
        responseObj.description = HLanguage('uz', 'searchPlace')
        inputMessageContent.message_text = HLanguage('uz', 'hintMessage')

        return await ctx.answerInlineQuery([responseObj])
    }

    // if exist inline query
    const allRegions = {...HLanguage('ru', 'region'), ...HLanguage('uz', 'region'), ...HLanguage('en', 'region')}
    const search = fuzzy.filter(inlineQueryMessage, Object.keys(allRegions))

    // but not result
    if (!search.length) {
        responseObj.title = HLanguage('uz', 'notFound')
        let description: string = HLanguage('uz', 'notFoundDescription')
        let message_text: string = HLanguage('uz', 'notFoundContent')

        responseObj.description = HReplace(description, ['$inlineQueryText'], [inlineQueryMessage])
        inputMessageContent.message_text = HReplace(message_text, ['$inlineQueryText'], [inlineQueryMessage])

        return await ctx.answerInlineQuery([responseObj])
    }

    // if result is exist
    let regionIds = []

    for (const result of search) {
        for (const key in allRegions) {
            if (key == result.string) regionIds.push(allRegions[key])
        }
    }

    regionIds = [...new Set(regionIds)].slice(0, 3)

    const now = new Date()
    const currentDay = now.getDate()
    const regionTranslations: string[] = HLanguage('uz', 'region')
    const regions = await Model.PrayTime.find({day: currentDay, regionId: regionIds})
    const message = HLanguage('uz', 'infoPrayTime')
    const dailyHadith = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'translate', 'localStorage.json'), {
            encoding: "utf-8"
        }),
    )?.dailyHadith
    const response: InlineQueryResult[] = []

    for (const region of regions) {
        let regionName = "";

        for (const key in regionTranslations) {
            if (region.regionId == regionTranslations[key]) {
                regionName = key
            }
        }

        const content = HReplace(
            message,
            ['$region', '$fajr', '$sunrise', '$zuhr', '$asr', '$maghrib', '$isha'],
            [regionName, region.fajr, region.sunrise, region.dhuhr, region.asr, region.maghrib, region.isha],
        )

        response.push({
            type: 'article',
            id: crypto.randomUUID(),
            title: regionName,
            description: content,
            input_message_content: {
                message_text: content + dailyHadith,
                parse_mode: 'HTML',
            },
        })
    }

    return await ctx.answerInlineQuery(response)
}
