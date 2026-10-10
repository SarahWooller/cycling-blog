Learn that I will ultimately host on railway. Ensure everything will port smoothly
We will have three types of user

## readers - no log in required
readers can ready all public blogs, can like posts and comment on them. 

## bloggers - log in required
can author blogs - amend and delete their own blogs.
can set the public/private switch for a blog
can switch on approve_comments which means that a comment has to be approved before it is visible 
can approve individual comments or delete them if approve_comments is on
can read all blogs public and private

## admin - log in required
has blogger rights for all blogs
can change the background photo.

We will use fastapi and a postgresql database
The database will hold post and user data, connecting users to posts.
Posts will be timestamped. 

The snapshots on the front page will either display latest, or favourites (most liked).
Next to the name will be the number of likes.
There will be an option to search by blogger name or show all.
Show all will display title, date, blogger name, number of likes
