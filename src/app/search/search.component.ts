import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  // search term and result objets
  searchTerm: string = '';
  searchResults: any = {results: []};
  errorMessage: string = '';
  statusMessage: string = '';

  // search filters and limits
  resultsPerpage = 10;

  // state variable
  isLoading: boolean = false;

  // timeout object
  timeout: any;

  constructor() { }

  ngOnInit(): void {
  }

  handleSearchInput(event: any){
	this.searchTerm = event.target.value || '';
	this.handleSearch();

  }

  handleSearch(){
	// clear the delay timeout if it's already active. 
    if(this.timeout !== undefined){
    	clearTimeout(this.timeout);
    }	
	// execute after a 500ms deplay to allow  to prevents requets from being sent while user is still tying
	this.timeout = setTimeout(() => {
		if(this.searchTerm.length > 0){
			// set loading state	
			this.isLoading = true;
			const request = new Request(`https://bie.ala.org.au/ws/search.json?q=${this.searchTerm}&fq=&dir=desc&sortField=score&rows=${this.resultsPerpage}`, {method: 'GET', mode:'cors'});
			// fetch the request
			fetch(request).then(async response => {
				// if the http request is successful and the response is a 200/202, handle the data
				if(response.ok){
					const data = await response.json();
					this.searchResults = data['searchResults'] || {};
					this.errorMessage = '';
				} else{
					this.errorMessage = `Error returning resultsf for '${this.searchTerm}' Please try again later.`;
					this.searchResults = {};
				}
				// catch request failures
			}).catch(e => {
				console.error(e);
				this.errorMessage = `Error returning resultsf for '${this.searchTerm}' Please try again later.`;
				this.searchResults = {};
				// handle on success or fail.
			}).finally(() => {
				// reset loading state
				this.isLoading = false;
			})
		}else{
			this.searchResults = {};
		}
	
	}, 500);
  }

  clearSearch(){
	  this.searchTerm = '';
	  this.searchResults = {};
  }

  openImage(url: string){
	  	window.open(url, '_blank')
  }

  handlePaginate(event: PageEvent){
	  this.resultsPerpage = event.pageSize;
	  this.handleSearch();
  }

    // fetch 100 records (if required) and export to csv
  handleDownload(){
	if(this.resultsPerpage === 100 && this.searchResults.results.length === 100){
		this.exportCSV(this.searchResults.results);
	} else{
		const request = new Request(`https://bie.ala.org.au/ws/search.json?q=${this.searchTerm}&fq=&dir=desc&sortField=score&rows=100`, {method: 'GET', mode:'cors'});
		fetch(request).then(async response => {
			// if the http request is successful and the response is a 200/202, handle the data
			if(response.ok){
				const data = await response.json();
				const results = data['searchResults'].results;
				this.exportCSV(results);
				this.errorMessage = '';
			} else{
				this.errorMessage = 'Error returning results. Please try again later.'
			}
			// catch request failures
		}).catch(e => {
			console.log(e);
			this.errorMessage = 'Error returning results. Please try again later.'
			// handle on success or fail.
		});
	}
  }
  

  // based on a TS implementation by Jorge Garcia of a generic csv export function 
  // https://www.clearpeople.com/blog/export-data-to-csv-with-typescript-without-format-issues
  exportCSV(results: any[]){
		const fileName = this.searchTerm;
		const exportHeaders  = ['id','guid','kingdom','kingdomGuid','scientificName','author','imageUrl'];
		const exportRows:any[] = [];
		// generate a new rows object with only the required attrinutes
		results.forEach(r => {
			exportRows.push({id:r.id, guid: r.guid, kingdom:r.kingdom, kingdomGuid:r.kingdomGuid, scientificName:r.scientificName, author:r.author,imageUrl:r.imageUrl});
		});
		// comma delimiter 
		const separator: string = ",";

		const keys: string[]  = Object.keys(exportRows[0]);

		const csvContent =
			"sep=,\n" +
			exportHeaders.join(separator) +
			'\n' +
			exportRows.map(row => {
				return keys.map(k => {
					let cell = row[k] === null || row[k] === undefined ? '' : row[k];

					cell = cell instanceof Date 
						? cell.toLocaleString()
						: cell.toString().replace(/"/g, '""');

					if (cell.search(/("|,|\n)/g) >= 0) {
						cell = `"${cell}"`;
					}
					return cell;
				}).join(separator);
			}).join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		// @ts-ignore
		if (navigator.msSaveBlob) { // In case of IE 10+
			// @ts-ignore
			navigator.msSaveBlob(blob, fileName);
		} else {
			const link = document.createElement('a');
			if (link.download !== undefined) {
				// Browsers that support HTML5 download attribute
				const url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', fileName);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}
	}
}
