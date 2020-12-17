# SD105-Assignment-1
For this assignment, you will be building a bus schedule search by making use of the [Winnipeg Transit Data API](https://api.winnipegtransit.com/). Sign-up for free access [here](https://api.winnipegtransit.com/).

Next, checkout this [demo of the project](https://mittnexbuss.web.app/).

## Submissions & Due Date
You will be required to submit a public Github respository URL and a hosted project URL under "Assignment 1 Submission" in myLearning no later than Friday, December 18th @ 11:59 PM.

    Late submissions will not be accepted

## Set-up
Get the HTML and CSS starter files for this assignment by cloning this repository:
  - https://github.com/cmacmitt/SD105-Assignment-1

Create a new public Github repository for this project and then:
- Delete the `.git` folder in your clone
- initialize a new git repository in the project directory
- connect your project to your own remote repository

## Requirements:
Your completed app will allow users to search for bus schedules by street name. A search term is entered into a text input and the search is executed once the user presses the enter key. Connecting to the [Winnipeg Transit Data API](https://api.winnipegtransit.com/), the search will return a list of streets that match the search query. Clicking on any of the streets in the returned list will display the next buses, for each route, at all the stops on a the selected street.

### Process
Process will be taken into consideration when grading this project.
- Make sensible, approriate commits along the way
- Use branching according to your best judgement
- Use `src` and `dist` folders and add a build process to your project
- Host your completed project on Netlify or Github pages

### Implementation Details
- Provide a `search` function that will allow users to search for a particular street by name. Winnipeg transit has a `Streets` [resource](https://api.winnipegtransit.com/home/api/v3/services/streets) to which you can submit a string and get back a list of matching streets (or an empty array).
  - If there are no streets that match, indicate with a short message indicating that no results were found.
  - If there are streets that match, provide a clickable link for each street below the search box, in the results pane.
  - All previous results should be removed, before new results are added.
  - You should display the full, long version of the street names, which requires a special queryString parameter be passed into the `streets` endpoint: `usage=long`.

Consider adding a custom `data` attribute to each street name `a` tag, so that way when the user clicks on it, you'll be able to retrieve the `key` - an ID that will help you identify the street, which you'll need to find all the stops, in the next section.

- Next, when a user clicks on a street, get all the stops on the chosen street. You'll need to use the [stops endpoint](https://api.winnipegtransit.com/home/api/v3/services/stops) to accomplish this.

- Take these results and  find the next 2 buses for each route, and populate that data into the table at each stop using the [stop schedules endpoint](https://api.winnipegtransit.com/home/api/v3/services/stop-schedules). Use `Promise.all` to display all the schedule data at the same time.

- Using all the information you've accumalated so far, output the following pieces of information: 
  - The name of the stop
  - The name of the cross street
  - The direction
  - The scheduled arrival time of the next 2 buses for each route at this stop.
  - The route number(bus #) for each of these buses.
  - The name of the street (this is displayed ABOVE the table)

### CAREFUL 
- When calling the API. The default returns XML. You probably want JSON. Go through the documentation to find out how to return JSON. 
- Some stops may not have upcoming buses, because by default, it the API only shows busses coming in the next 2 hours. If you want to modify this you are welcome, but not required. However, you need to make sure you consider this when parsing then data - you may want to check for empty arrays.
- Occasionally, there may be some data that you are expecting to be there but isn't. I found on a fairly consistent basis, when I request about the data for 50 stops, I might receive 1 error, which doesn't really affect my overall product. I would consider this acceptable.
- You are restricted to 100 API calls per minute. Careful, this can be the source of some interesting errors.