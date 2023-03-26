import { Bot, session } from 'grammy'
import 'dotenv/config'
import Model from '#config/database'
import { scenes } from './scenes/index.js'
import HLanguage from '#helper/language'
import { HCheck } from '#helper/user-check'
import cron from 'node-cron'
import { daily, monthly, reminder } from './cron/cron.js'

const token = process.env.TOKEN
const bot = new Bot(token)

const monthlyCron = cron.schedule('0 0 1 * *', async () => {
  await monthly()
})
const dailyCron = cron.schedule('0 1 * * *', async () => {
  await daily(bot)
  await reminder(bot)
})

// middleware
bot.use(session({ initial: () => ({}) }))
bot.use(scenes.manager())
bot.use(scenes)

// Commands
bot.command('language', async (ctx) => {
  HCheck(ctx)

  return ctx.scenes.enter('Language')
})

bot.command('notification', async (ctx) => {
  HCheck(ctx)

  await ctx.scenes.enter('Notification')
})

bot.command('fasting', async (ctx) => {
  HCheck(ctx)

  await ctx.scenes.enter('Fasting')
})

bot.command('start', async (ctx) => {
  HCheck(ctx)
})

bot.command('location', async (ctx) => {
  HCheck(ctx)

  await ctx.scenes.enter('Location')
})

bot.command('search', async (ctx) => {
  HCheck(ctx)

  await ctx.scenes.enter('Search')
})

bot.command('statistic', async (ctx) => {
  HCheck(ctx)

  await ctx.scenes.enter('Statistic')
})

bot.command('advertise', async (ctx) => {
  HCheck(ctx)

  await ctx.scenes.enter('Advertise')
})

bot.on('message:text', async (ctx) => {
  const userId = ctx.update.message.from.id
  const user = await Model.User.findOne({ userId })

  if (ctx.update.message.from.is_bot) return
  if (!user) return ctx.scenes.enter('Start')

  const keyboardText = HLanguage(user.language, 'mainKeyboard')

  if (ctx.message.text === keyboardText[0]) ctx.scenes.enter('Search')
  if (ctx.message.text === keyboardText[1]) ctx.scenes.enter('Language')
  if (ctx.message.text === keyboardText[2]) ctx.scenes.enter('Location')
  if (ctx.message.text === keyboardText[3]) ctx.scenes.enter('Fasting')
  if (ctx.message.text === keyboardText[4]) ctx.scenes.enter('Notification')
})

// error handling
// bot.catch((err) => {
//   const ctx = err.ctx
//   const error = err.error
//   const name = err.name

//   const response = `By: ${ctx?.update?.message?.from?.id || ctx?.update?.callback_query?.from?.id}\nUsername: @${
//     ctx?.update?.message?.from?.username || ctx?.update?.callback_query?.from?.username
//   }\nError: ${name}\nError message: ${error}`

//   bot.api.sendMessage(1151533771)
// })

bot.start()
monthlyCron.start()
dailyCron.start()

reminder(bot)
