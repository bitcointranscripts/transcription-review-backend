
# Make executable with chmod +x <<filename.sh>>

# Set your auth token here
AUTH_TOKEN="${6}"


echo "Found ${AUTH_TOKEN}"
# Check if authenticated with GitHub
if curl -H "Authorization: token ${AUTH_TOKEN}" https://api.github.com/user > /dev/null 2>&1; then
  echo "Already authenticated with GitHub"
else
  echo "Authenticating with GitHub..."
  echo "${AUTH_TOKEN}" | git credential-store --file ~/.git-credentials store
  git config --global credential.helper 'store --file ~/.git-credentials'
fi

# check if the repo exists
if [ -d "./bitcointranscripts/" ]; then
  # set the repo to the current directory
  git pull upstream master
  cd bitcointranscripts || exit
else
  # fork and clone the repo
  gh repo fork bitcointranscripts/bitcointranscripts 
  git clone https://${AUTH_TOKEN}@github.com/bitcointranscripts/bitcointranscripts.git
  cd bitcointranscripts || exit
  git remote set-url origin "https://${AUTH_TOKEN}@github.com/${4}/bitcointranscripts.git"
  git remote add upstream https://${AUTH_TOKEN}@github.com/bitcointranscripts/bitcointranscripts.git
  git fetch upstream
  git branch --set-upstream-to="${4}/master" master
fi

# check if the current branch is master else checkout master
git_branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "${git_branch}" != "master" ]; then
  git checkout master
fi

git pull

# create a new branch or checkout the branch if it exists
if [ "$(git show-ref --quiet refs/heads/${5}-${3})" ]; then
  git checkout "${5}-${3}"
else
  git checkout -b "${5}-${3}"
fi

echo "switched to branch ${5}-${3}"

# check if the loc exists or not
if [ ! -d "./${2}" ]; then
  mkdir -p "${2}"
fi

temp=${PWD}

# discover the directories
IFS=/ read -ra dirs <<< "${2}"

for item in "${dirs[@]}"
do
    cd "${item}" || return #tvpeter

    # check if the index file exists
    if [ ! -f ./_index.md ]; then
      echo -e "---\ntitle: ${item}\n---\n\n{{< childpages >}}" >> _index.md
    fi

done

# go back to the original directory
cd "${temp}" || return

# move the transcript to the directory
mv "${1}" "./${2}"

