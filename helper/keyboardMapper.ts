import HLanguage from '#helper/language'

export const keyboardMapper = (text: any) => {
  const keyboardText = HLanguage('mainKeyboard')

  const options = {
    [keyboardText[0]]: 'Search',
    [keyboardText[1]]: 'Location',
    [keyboardText[2]]: 'Fasting',
    [keyboardText[3]]: 'Notification',
    [keyboardText[4]]: 'Statistic',
    // [keyboardText[5]]: "Donate"
  }

  return options[text]
}
