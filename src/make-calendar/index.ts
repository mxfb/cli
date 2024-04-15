import {
  endOfYear,
  startOfYear,
  endOfMonth,
  getWeek,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  format as dateFormat,
  getMonth,
  getDate,
  getDay
} from 'date-fns'

type WeekData = {
  year: number
  number: number
  firstDay: Date
  lastDay: Date
}

// [WIP] use commander

const year = parseInt(`${process.argv[2]}`)
makeCalendar(year)

export default function makeCalendar (inputYear: number) {
  const year = parseInt(`${inputYear}`)
  const start = startOfYear(new Date(year, 0, 1))
  const end = endOfYear(new Date(year, 11, 31))
  const weeksStartDates = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  const weeks: WeekData[] = weeksStartDates.map(weekStartDate => {
    const firstDay = weekStartDate
    const lastDay = endOfWeek(firstDay, { weekStartsOn: 1 });
    const year = lastDay.getFullYear();
    const number = getWeek(firstDay, { weekStartsOn: 1 })
    return {
      year,
      number,
      firstDay,
      lastDay
    }
  })
  console.log(
`│ ${year}                                            Posés         Solde         Note
│ date         —  sem   —  l m m j v s + l        cp     rtt    cp     rtt    
│ ————————————————————————————————————————————————————————————————————————————————————————————————————
│`)
  weeks.forEach(weekData => {
    const onTwoMonths = getMonth(weekData.firstDay) !== getMonth(weekData.lastDay)
    const monthEnd = endOfMonth(weekData.firstDay)
    const isMonthEnd = getDate(weekData.lastDay) === getDate(monthEnd)
    console.log(`
      │ ${dateFormat(weekData.firstDay, 'MMM dd')} › ${dateFormat(weekData.lastDay, 'dd')}  —  S ${weekData.number.toString().padStart(2, '0')}  —  _ _ _ _ _ + _ _        ___    ___    ___    ___
    `.trim())
    if (onTwoMonths || isMonthEnd) console.log('│')
  })
}

/*`
62 jours
                                                                                                     
|    Calendrier                                        Posés          Solde             Note
|    date         -  sem   -   l m m j v s + l         cp     rtt      cp     rtt    
|    ------------------------------------------------------------------------------------------------
|
|    jan XX › XX  -  S 01  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jan XX › XX  -  S 02  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jan XX › XX  -  S 03  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jan XX › XX  -  S 04  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jan XX › XX  -  S 05  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    feb XX › XX  -  S 06  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    feb XX › XX  -  S 07  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    feb XX › XX  -  S 08  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    feb XX › XX  -  S 09  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    
|    mar XX › XX  -  S 10  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    mar XX › XX  -  S 11  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    mar XX › XX  -  S 12  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    mar XX › XX  -  S 13  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    apr XX › XX  -  S 14  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    apr XX › XX  -  S 15  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    apr XX › XX  -  S 16  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    apr XX › XX  -  S 17  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    apr XX › XX  -  S 18  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    may XX › XX  -  S 19  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    may XX › XX  -  S 20  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    may XX › XX  -  S 21  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    may XX › XX  -  S 22  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    jun XX › XX  -  S 23  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jun XX › XX  -  S 24  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jun XX › XX  -  S 25  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jun XX › XX  -  S 26  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    jul XX › XX  -  S 27  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jul XX › XX  -  S 28  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jul XX › XX  -  S 29  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jul XX › XX  -  S 30  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    jul XX › XX  -  S 31  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    aug XX › XX  -  S 32  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    aug XX › XX  -  S 33  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    aug XX › XX  -  S 34  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    aug XX › XX  -  S 35  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    sep XX › XX  -  S 36  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    sep XX › XX  -  S 37  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    sep XX › XX  -  S 38  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    sep XX › XX  -  S 39  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    sep XX › XX  -  S 40  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    oct XX › XX  -  S 41  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    oct XX › XX  -  S 42  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    oct XX › XX  -  S 43  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    oct XX › XX  -  S 44  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    nov XX › XX  -  S 45  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    nov XX › XX  -  S 46  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    nov XX › XX  -  S 47  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    nov XX › XX  -  S 48  -   _ _ _ _ _ _ + _         -10    -10      80     80     

|    dec XX › XX  -  S 49  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    dec XX › XX  -  S 50  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    dec XX › XX  -  S 51  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    dec XX › XX  -  S 52  -   _ _ _ _ _ _ + _         -10    -10      80     80     
|    dec XX › XX  -  S 53  -   _ _ _ _ _ _ + _         -10    -10      80     80     
`*/
