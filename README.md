# WebScraper

PROBLEM DEFINATION

The web creates challenges for information retrieval. The amount of information on the web is growing rapidly, as well as the number of new users inexperienced in the art of web research because people have different domains that they work in. People are likely to surf the web using high quality human maintained indices such as Yahoo or with search engines. Google takes it a step further with crawling and Page Rank. Because Google crawl’s these pages, it also gets into links with direct access to media files and text documents, which can be easily found by using Google dorks. But searching in this manner proves difficult for many users.


WebScraper  
WebScraper is an application which crawls and these webpages and stores links, that would prove useful later for downloading.
This is where the system proves smart, by only storing their links and not the entire files.
    • Crawler
Running a web crawler is a challenging task. There are tricky performance and reliability issues and even more importantly, there are social issues. Crawling is the most fragile application since it involves interacting with hundreds of thousands of web servers and various name servers which are all beyond the control of the system. It is difficult to measure how long crawling took overall because disks filled up, name servers crashed, or any number of other problems which stopped the system.

Existing system & need for new system

We are against the likes of Google but still Google dorks aren’t as useable as the WebScraper.

Need For New System:
Making the same things easier and more usable is just another way of improving ease of access.  Using only the links to these media files has been a great triumph as it only stores media links which are easily downloadable. 

Scope of the System
This system only focuses on Media Links which are hosted in different websites. The system doesn’t worry about what the content is until and unless it is a media file or some text based document (pdf,docx etc).


FEASIBILITY STUDY
    1) Technical feasibility:  
The technologies used in the project are very well documented and tested. The consistency provided by Beautiful Soup (https://pypi.org/project/beautifulsoup4/) has been really helpful for the developers.
The technology used (i.e. python) enables developers for rapid development and has huge support in the community.  
2)    Economic Feasibility:
The System is a every growing system because of the crawler that is crawling the pages consistently and storing them in the database. But this application could easily be monetised by using advertisement, which would help with the systems hardware resources. 

3)    Operational feasibility:
  The developed project is a web application. The basic knowledge of computer is enough for the user to use the application. Application runs only in the browser as a web page and doesn’t affect the execution of other programs, No special permission/ setups installation is required. No special training to the user is required hence the proposed system is operationally feasible.


Hardware & Software Setup Requirements (User):-

      Software (min):
          1. Browser (e.g. Firefox,Chrome)
      Hardware (min):
          • 1 GB RAM(To support heavy browsers)
          • 20 GB HDD(To support newer operating systems)
          • Intel P4 or above

Hardware & Software Setup Requirements (System Development):-

    Software (min):
          1 Python3.5 and above
          2 Beautiful Soup 4
          3 MongoDB

    Hardware (min):
        • 1 GB RAM(To support heavy browsers) (4 GB recommended)
        • 20 GB HDD(To support newer operating systems)
        • Storage for Mongodb according to the how much the system will scale  
        • Intel Core 2 Duo processor and above


Testing
 The most important measure of a search engine is the quality of its search results. While a complete user evaluation is beyond
 the scope of this paper, our own experience with WebScraper has shown it to produce good results for media search and has a lot
 of improvement. The numbers of results are considerably small. 
Aside from search quality, WebScraper is designed to scale cost effectively to the size of the Web as it grows.
In just three URL’s our crawler was able to index approximately 15000 links. It is important for a search engine to crawl and
index efficiently. This way information can be kept up to date and major changes to the system can be tested relatively quickly.



CONCLUSION

WebScraper is designed to be a scalable search engine. The primary goal is to provide high quality search results over a rapidly
growing World Wide Web. 



REFERENCE


    • http://stackoverflow.com
    • https://use-the-index-luke.com/sql/testing-scalability
    • http://infolab.stanford.edu/~backrub/google.html
    • https://pypi.org/project/beautifulsoup4/
    
## TODO
- https://typesense.org/downloads/
