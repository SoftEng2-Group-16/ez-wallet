# Project Estimation - CURRENT
Date: 27/04/2023

Version: 1.2


# Estimation approach
Consider the EZWallet  project in CURRENT version (as received by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |    12 (mainly js modules)                         |             
|  A = Estimated average size per class, in LOC       |      75                      | 
| S = Estimated size of project, in LOC (= NC * A) | 900 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |                90 ph                      |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 2700 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |           3 days         |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    | 20 |
| GUI prototype | 12 |
|design document | 5 |
|code | 60 |
| unit tests | 15 |
| api tests | 15 |
| management documents  | 5 |



# Estimate by activity decomposition

Assuming an average of 10 LOC per person hour in coding and testing cases
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| define F/NF Requirement | 4|
| indentify Actor and Stakeholders | 2 |
| define Use Case and Scenarios | 6 |
| System Design e Design document| 8 |
| UML Diagrams and Management Document | 8 |
| Coding | 60|
| GUI prototype |12 |
| API/Unit testing |30|
| Final Review | 6 |
###
![gant diagram](images/GanttV1.png)

# Summary


The duration is calculated considering a team of 4 people that work 8 hs a day for 5 days per week

|             | Estimated effort (person hours)                        |   Estimated duration (days) |          
| ----------- | ------------------------------- | ---------------|
| estimate by size | 90 | 3 |
| estimate by product decomposition | 132 | 4 |
| estimate by activity decomposition | 138  | 4 |


The differences between the various types of estimations lay on the fact that:

-Estimation by size refers to the raw size of the application code developed in order to fullfill the fuctional requirements

-Estimation by product decomposition also comprend the development and management document and is an overall sum of the work hours needed

-Estimation by activity decomposition refers to the same elements of the the one "by product decomposition" plus the final review by the the team, but includes also the presence of contraints related to the activities that are predecessors of others, it also includes the benefits of parallelization of some activites made possible by task distribution between the team members.
